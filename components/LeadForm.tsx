"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { useDictionary } from "@/lib/i18n/LocaleProvider";

const PUBLIC_DOMAINS = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com',
    'mail.ru', 'yandex.ru', 'live.com', 'protonmail.com', 'aol.com', 'zoho.com', 'gmx.com'
];

export default function LeadForm() {
    const router = useRouter();
    const dict = useDictionary().leadForm;
    const [score, setScore] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showDomainWarning, setShowDomainWarning] = useState(false);

    // Settings & Errors
    const [requireOtp, setRequireOtp] = useState(true);
    const [emailError, setEmailError] = useState<string | null>(null);

    // OTP State
    const [step, setStep] = useState<'details' | 'otp'>('details');
    const [otp, setOtp] = useState("");

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        companyName: "",
        companySize: "", // Mapped to 'employees' in API
        email: "",
        phone: "",
        gdpr: false,
        marketingConsent: true,
    });

    useEffect(() => {
        // Retrieve score from previous step
        const storedScore = localStorage.getItem("assessmentScore");
        if (!storedScore) {
            router.push("/assessment"); // Redirect if no score
        }
        setScore(storedScore);

        // Fetch Settings
        fetch("/api/admin/settings")
            .then(res => res.json())
            .then(data => {
                // If requireOtp is explicitly false, set it. Default is true.
                if (data && typeof data.requireOtp === 'boolean') {
                    setRequireOtp(data.requireOtp);
                }
            })
            .catch(err => console.error("Failed to fetch settings", err));
    }, [router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        // Clear errors on change
        if (name === 'email') setEmailError(null);

        if (name === 'email') {
            const domain = value.split('@')[1]?.toLowerCase();
            if (domain && PUBLIC_DOMAINS.includes(domain)) {
                setShowDomainWarning(true);
            } else {
                setShowDomainWarning(false);
            }
        }

        // Handle checkbox separately
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const getPhaseId = (score: number) => {
        if (score < 2) return 1;
        if (score < 3) return 2;
        if (score < 4) return 3;
        if (score < 5) return 4;
        return 5;
    };

    const handleSendOtp = async () => {
        setEmailError(null);
        try {
            const res = await fetch("/api/otp/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: formData.email,
                    name: formData.firstName,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    companyName: formData.companyName,
                    phone: formData.phone,
                    employees: formData.companySize,
                    score: score || "0",
                    phaseId: getPhaseId(parseFloat(score || "0")),
                    answers: JSON.parse(localStorage.getItem("assessmentAnswers") || "{}"),
                    isNewLead: true // Flag to check duplicates
                }),
            });

            if (res.status === 409) {
                setEmailError("exists");
                return;
            }

            if (!res.ok) throw new Error("Failed to send code");
            setStep('otp');
        } catch (error) {
            console.error("OTP Send Error", error);
            alert(dict.otpSendError);
        }
    };

    const submitAssessment = async () => {
        const answers = localStorage.getItem("assessmentAnswers");

        const res = await fetch("/api/assessment/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                firstName: formData.firstName,
                lastName: formData.lastName,
                companyName: formData.companyName,
                employees: formData.companySize,
                email: formData.email,
                phone: formData.phone,
                marketingConsent: formData.marketingConsent,
                score,
                phaseId: getPhaseId(parseFloat(score || "0")),
                answers: answers ? JSON.parse(answers) : {}
            }),
        });

        if (res.status === 409) {
            // If OTP is disabled and email exists, redirect to result directly
            if (!requireOtp) {
                try {
                    const bypassRes = await fetch("/api/otp/send", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            email: formData.email,
                            bypassOtp: true
                        })
                    });
                    const bypassData = await bypassRes.json();
                    if (bypassData.leadId) {
                        router.push(`/result?leadId=${bypassData.leadId}`);
                        return;
                    }
                } catch (e) {
                    console.error("Bypass redirect failed", e);
                }
            }

            setEmailError("exists");
            throw new Error("Email exists");
        }

        if (!res.ok) throw new Error("Failed to submit");

        // Store user name for Result Page personalization
        localStorage.setItem("userName", formData.firstName);
        localStorage.setItem("companyName", formData.companyName);
        localStorage.setItem("assessmentEmail", formData.email);

        router.push("/result");
    };

    const handleVerifyAndSubmit = async () => {
        try {
            // 1. Verify OTP
            const verifyRes = await fetch("/api/otp/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: formData.email, code: otp }),
            });

            if (!verifyRes.ok) {
                const err = await verifyRes.json();
                throw new Error(err.message || "Invalid code");
            }

            // 2. Submit Assessment
            await submitAssessment();

        } catch (error: any) {
            if (error.message === "Email exists") return; // Handled in submit
            console.error("Verification Error", error);
            alert(error.message || dict.otpInvalidError);
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        let isNavigating = false;

        try {
            if (step === 'details') {
                if (requireOtp) {
                    await handleSendOtp();
                } else {
                    // Bypass OTP
                    await submitAssessment();
                    isNavigating = true;
                }
            } else {
                await handleVerifyAndSubmit();
                isNavigating = true;
            }
        } catch (e) {
            console.error(e);
        }

        if (!isNavigating) {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto bg-white dark:bg-gec-navy p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gec-teal">
            <h2 className="text-2xl font-bold mb-6 text-gec-navy dark:text-white text-center">
                {step === 'details' ? dict.resultReadyTitle : dict.verificationTitle}
            </h2>
            <p className="text-gray-500 text-center mb-8">
                {step === 'details'
                    ? dict.detailsSubtitle
                    : dict.otpSubtitle(formData.email)
                }
            </p>

            <form onSubmit={handleFormSubmit} className="space-y-4">
                {/* ... existing fields ... */}
                {step === 'details' ? (
                    <>
                        {/* Name & Surname per existing layout... */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gec-navy dark:text-gray-300">
                                    {dict.firstNameLabel} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    required
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-gray-200 dark:border-white/20 bg-gray-50 dark:bg-white/5 p-3 text-gec-navy dark:text-white placeholder-gray-400 focus:border-[#F05324] focus:outline-none focus:ring-1 focus:ring-[#F05324]"
                                    placeholder={dict.firstNamePlaceholder}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gec-navy dark:text-gray-300">
                                    {dict.lastNameLabel} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    required
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-gray-200 dark:border-white/20 bg-gray-50 dark:bg-white/5 p-3 text-gec-navy dark:text-white placeholder-gray-400 focus:border-[#F05324] focus:outline-none focus:ring-1 focus:ring-[#F05324]"
                                    placeholder={dict.lastNamePlaceholder}
                                />
                            </div>
                        </div>

                        {/* Company Name */}
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gec-navy dark:text-gray-300">
                                {dict.companyNameLabel} <span className="text-red-500">*</span>
                            </label>
                            <input
                                required
                                type="text"
                                name="companyName"
                                value={formData.companyName}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-200 dark:border-white/20 bg-gray-50 dark:bg-white/5 p-3 text-gec-navy dark:text-white placeholder-gray-400 focus:border-[#F05324] focus:outline-none focus:ring-1 focus:ring-[#F05324]"
                                placeholder={dict.companyNamePlaceholder}
                            />
                        </div>

                        {/* Email & Phone */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gec-navy dark:text-gray-300">
                                    {dict.emailLabel} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    required
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-gray-200 dark:border-white/20 bg-gray-50 dark:bg-white/5 p-3 text-gec-navy dark:text-white placeholder-gray-400 focus:border-[#F05324] focus:outline-none focus:ring-1 focus:ring-[#F05324]"
                                    placeholder="name@company.ge"
                                />
                                {showDomainWarning && !emailError && (
                                    <div className="flex items-start gap-2 mt-2 text-orange-400 text-sm animate-fadeIn">
                                        <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                                        <p>{dict.domainWarning}</p>
                                    </div>
                                )}
                                {emailError === "exists" && (
                                    <div className="flex items-start gap-2 mt-2 text-gec-navy bg-blue-50 p-2 rounded text-sm animate-fadeIn border border-blue-100">
                                        <p>
                                            {dict.emailExistsPrefix}<Link href="/my-report" className="text-[#F05324] font-bold underline">{dict.emailExistsLinkText}</Link>{dict.emailExistsSuffix}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gec-navy dark:text-gray-300">
                                    {dict.phoneLabel} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    required
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-gray-200 dark:border-white/20 bg-gray-50 dark:bg-white/5 p-3 text-gec-navy dark:text-white placeholder-gray-400 focus:border-[#F05324] focus:outline-none focus:ring-1 focus:ring-[#F05324]"
                                    placeholder="+995 5xx xx xx xx"
                                />
                            </div>
                        </div>

                        {/* Company Size */}
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gec-navy dark:text-gray-300">
                                {dict.companySizeLabel} <span className="text-red-500">*</span>
                            </label>
                            <select
                                required
                                name="companySize"
                                value={formData.companySize}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-200 dark:border-white/20 bg-gray-50 dark:bg-white/5 p-3 text-gec-navy dark:text-white focus:border-[#F05324] focus:outline-none focus:ring-1 focus:ring-[#F05324] [&>option]:bg-white dark:[&>option]:bg-[#153749] [&>option]:text-gec-navy dark:[&>option]:text-white"
                            >
                                <option value="" disabled>{dict.companySizePlaceholder}</option>
                                <option value="1-10">1-10</option>
                                <option value="11-50">11-50</option>
                                <option value="51-200">51-200</option>
                                <option value="201+">201+</option>
                            </select>
                        </div>

                        {/* Marketing Consent */}
                        <div className="pt-2">
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <div className="relative flex items-center justify-center mt-1">
                                    <input
                                        type="checkbox"
                                        name="marketingConsent"
                                        checked={formData.marketingConsent}
                                        onChange={handleChange}
                                        className="appearance-none w-5 h-5 border-2 border-gray-300 dark:border-white/30 rounded inline-flex shrink-0 checked:bg-[#F05324] checked:border-[#F05324] focus:outline-none focus:ring-2 focus:ring-[#F05324] focus:ring-offset-2 transition-all"
                                    />
                                    <svg className={`absolute w-3.5 h-3.5 text-white pointer-events-none transition-opacity ${formData.marketingConsent ? 'opacity-100' : 'opacity-0'}`} viewBox="0 0 14 14" fill="none">
                                        <path d="M3 8L6 11L11 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                                <span className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed user-select-none">
                                    {dict.marketingConsentLabel}
                                </span>
                            </label>
                        </div>
                    </>
                ) : (
                    // OTP Step
                    <div className="space-y-4 animate-fadeIn">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gec-navy dark:text-gray-300">
                                {dict.otpLabel}
                            </label>
                            <input
                                required
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                className="w-full rounded-lg border border-gray-200 dark:border-white/20 bg-gray-50 dark:bg-white/5 p-3 text-gec-navy dark:text-white text-center text-2xl tracking-widest placeholder-gray-400 focus:border-[#F05324] focus:outline-none focus:ring-1 focus:ring-[#F05324]"
                                placeholder="------"
                                maxLength={6}
                            />
                        </div>
                        <div className="text-center">
                            <button
                                type="button"
                                onClick={() => setStep('details')}
                                className="text-sm text-gray-400 hover:text-white underline"
                            >
                                {dict.otpBackLink}
                            </button>
                        </div>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-full bg-[#F05324] py-4 text-lg font-bold text-white shadow-lg transition-all hover:bg-orange-600 hover:shadow-xl disabled:opacity-50"
                >
                    {loading ? dict.submitProcessing : (step === 'details' ? (requireOtp ? dict.submitGetCode : dict.submitViewResult) : dict.submitConfirmAndView)}
                </button>
            </form>
        </div>
    );
}
