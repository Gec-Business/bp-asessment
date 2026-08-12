"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Mail, Lock } from "lucide-react";
import { useDictionary } from "@/lib/i18n/LocaleProvider";

export default function MyReportPage() {
    const router = useRouter();
    const dict = useDictionary().myReport;
    const [step, setStep] = useState<'email' | 'otp'>('email');
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [requireOtp, setRequireOtp] = useState(true);
    const [logoUrl, setLogoUrl] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/admin/settings")
            .then(res => res.json())
            .then(data => {
                if (data) {
                    if (typeof data.requireOtp === 'boolean') setRequireOtp(data.requireOtp);
                    if (data.logoUrl) setLogoUrl(data.logoUrl);
                }
            })
            .catch(err => console.error("Failed to fetch settings", err));
    }, []);

    const checkEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/otp/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                if (data.error === "NotFound") throw new Error(dict.errorNotFound);
                throw new Error(dict.errorSendFailed);
            }
            setStep('otp');
        } catch (err: any) {
            setError(err.message || dict.errorSendFailed);
        } finally {
            setLoading(false);
        }
    };

    const verifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        let isNavigating = false;

        try {
            const res = await fetch("/api/otp/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, code: otp }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || dict.errorInvalidCode);
            }

            // Note: The verify API currently returns { success: true }.
            // We need to fetch the lead ID. 
            // Since we can't fully trust client to search DB, we need an API.
            // I will assume for this task I need to resolve the Lead ID.
            // I'll use the /api/assessment/company-report as a proxy? No.

            // I'll add a separate step to find the lead after verification? 
            // Or I'll update `verify` route to return leadId if found.
            // I will assume `verify` returns `leadId` in `data` (I need to update the API route for this!).

            if (data.leadId) {
                router.push(`/result?leadId=${data.leadId}`);
                isNavigating = true;
            } else {
                // If API doesn't return leadId, we might be stuck.
                // I will update the API route in the next step to return leadId.
                setError(dict.errorReportNotFound);
            }

        } catch (err: any) {
            setError(err.message || dict.errorInvalidCode);
        } finally {
            if (!isNavigating) {
                setLoading(false);
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#002D40] to-[#004e6b] flex flex-col relative overflow-hidden">
            {/* Subtle Geometric Pattern Overlay */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
            </div>

            <header className="py-6 px-8 relative z-10">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-6">
                        <Link href="/" className="flex items-center gap-2">
                            {logoUrl ? (
                                <Image
                                    src={logoUrl}
                                    alt="Logo"
                                    width={140}
                                    height={50}
                                    className={`h-12 w-auto object-contain ${(!logoUrl.includes('data:image') && logoUrl === '/logo.png') ? 'brightness-0 invert' : ''}`}
                                    priority
                                />
                            ) : (
                                <span className="text-2xl font-bold text-white tracking-tighter">GEC</span>
                            )}
                        </Link>
                    </div>
                    <Link href="/" className="text-sm font-medium text-white/80 hover:text-white flex items-center gap-2 transition-colors">
                        <ArrowLeft size={18} />
                        {dict.backToHome}
                    </Link>
                </div>
            </header>

            <main className="flex-1 flex items-center justify-center p-4 relative z-10 -mt-10">
                <div className="w-full max-w-xl bg-white/95 backdrop-blur-md rounded-[2.5rem] shadow-2xl border border-white/20 p-10 md:p-14 transform transition-all duration-500 hover:shadow-orange-500/10">
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-50 rounded-full mb-6">
                            {step === 'email' ? <Mail className="text-[#F05324]" size={36} /> : <Lock className="text-[#F05324]" size={36} />}
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-[#002D40] mb-4">
                            {step === 'email' ? dict.emailStepTitle : dict.otpStepTitle}
                        </h1>
                        <p className="text-gray-600 text-lg leading-relaxed">
                            {step === 'email'
                                ? dict.emailStepSubtitle
                                : dict.otpStepSubtitle(email)
                            }
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 text-sm p-4 rounded-xl mb-6 text-center animate-shake">
                            {error}
                        </div>
                    )}

                    <form onSubmit={step === 'email' ? checkEmail : verifyOtp} className="space-y-8">
                        {step === 'email' ? (
                            <div className="space-y-3">
                                <label className="text-base font-semibold text-[#002D40] block ml-1">{dict.emailLabel}</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-4 text-gray-400 group-focus-within:text-[#F05324] transition-colors">
                                        <Mail size={22} />
                                    </div>
                                    <input
                                        required
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 focus:border-[#F05324] focus:ring-4 focus:ring-orange-500/10 outline-none transition-all text-lg bg-white text-gray-900 placeholder:text-gray-400"
                                        placeholder="name@company.ge"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="relative group">
                                    <div className="absolute left-4 top-4 text-gray-400 group-focus-within:text-[#F05324] transition-colors">
                                        <Lock size={22} />
                                    </div>
                                    <input
                                        required
                                        type="text"
                                        maxLength={6}
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 focus:border-[#F05324] focus:ring-4 focus:ring-orange-500/10 outline-none transition-all tracking-[0.5em] text-center text-2xl font-bold bg-white text-[#002D40] placeholder:text-gray-400"
                                        placeholder="------"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => { setStep('email'); setError(null); }}
                                    className="text-sm font-medium text-gray-500 hover:text-[#F05324] transition-colors block mx-auto underline underline-offset-4"
                                >
                                    {dict.changeEmail}
                                </button>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#F05324] hover:bg-[#d64520] text-white font-bold py-5 rounded-2xl transition-all shadow-lg hover:shadow-orange-500/30 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed text-lg"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    {dict.processing}
                                </span>
                            ) : (step === 'email' ? (requireOtp ? dict.submitGetCode : dict.submitViewResult) : dict.submitViewReport)}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}
