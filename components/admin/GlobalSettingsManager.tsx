"use client";

import { useEffect, useState } from "react";
import { Check, ChevronRight } from "lucide-react";

type GlobalSettings = {
    id: number;
    logoUrl: string;
    logoWidth: number;
    baseFontSize: number;
    colors: string; // JSON
    thresholds: string;

    // Landing
    heroTitle: string;
    heroSubtitle: string;
    buttonText: string;
    footerText: string;
    contactEmail: string;
    contactAddress: string;
    whyMattersTitle: string;

    // Assessment
    assessmentPageTitle: string;
    assessmentPageSubtitle: string;
    assessmentPromptText: string;
    myReportBtnText: string;
    requireOtp: boolean;
    termsAndConditionsText: string;

    // Results
    resultPageTitle: string;
    resultPersonalReportBtn: string;
    resultCompanyReportBtn: string;
    resultOrganizationLabel: string;
    resultScoreLabel: string;
    resultDownloadBtnText: string;
    resultRestartBtnText: string;
    resultNoDataText: string;

    // Phase Labels
    phaseEssenceLabel: string;
    phaseCharacteristicsLabel: string;
    phaseFocusLabel: string;

    // Booking
    bookingText: string;
    bookingLink: string;
};

const TABS = ["General", "Landing Page", "Assessment", "Results & Reports"];

export default function GlobalSettingsManager() {
    const [settings, setSettings] = useState<GlobalSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("General");

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch("/api/admin/settings");
            if (res.ok) {
                const data = await res.json();
                setSettings(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!settings) return;
        setSaving(true);
        try {
            const res = await fetch("/api/admin/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings),
            });
            if (res.ok) {
                // optional: show toast
            } else {
                alert("Failed to save.");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (key: keyof GlobalSettings, value: any) => {
        if (!settings) return;
        setSettings({ ...settings, [key]: value });
    };

    if (loading) return <div>Loading settings...</div>;
    if (!settings) return <div>Error loading settings.</div>;

    return (
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                <h2 className="text-xl font-bold text-gec-navy">Global Settings</h2>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-gec-orange text-white px-6 py-2 rounded-lg font-bold hover:opacity-90 transition-opacity shadow-sm flex items-center gap-2 disabled:opacity-50"
                >
                    {saving ? "Saving..." : <><Check size={18} /> Save Changes</>}
                </button>
            </div>

            <div className="flex border-b">
                {TABS.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === tab
                            ? "border-gec-orange text-gec-orange bg-orange-50"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="p-8">
                {activeTab === "General" && (
                    <div className="space-y-6 max-w-3xl">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">Logo Image</label>
                            <div className="flex items-center gap-4">
                                {settings.logoUrl && (
                                    <div className="p-2 border rounded bg-gray-50">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={settings.logoUrl} alt="Logo Preview" className="h-10 object-contain" />
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => handleChange("logoUrl", reader.result);
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gec-orange file:text-white hover:file:bg-orange-600"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">Logo Width (px)</label>
                            <input
                                type="number"
                                value={settings.logoWidth || 256}
                                onChange={(e) => handleChange("logoWidth", parseInt(e.target.value) || 256)}
                                className="w-full border p-2 rounded text-gray-900 bg-white focus:ring-2 focus:ring-gec-orange outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">Global Base Font Size (px)</label>
                            <input
                                type="number"
                                value={settings.baseFontSize || 16}
                                onChange={(e) => handleChange("baseFontSize", parseInt(e.target.value) || 16)}
                                className="w-full border p-2 rounded text-gray-900 bg-white focus:ring-2 focus:ring-gec-orange outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">Footer Copyright Text</label>
                            <input
                                value={settings.footerText || ""}
                                onChange={(e) => handleChange("footerText", e.target.value)}
                                className="w-full border p-2 rounded text-gray-900 bg-white focus:ring-2 focus:ring-gec-orange outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Contact Email</label>
                                <input
                                    value={settings.contactEmail || ""}
                                    onChange={(e) => handleChange("contactEmail", e.target.value)}
                                    className="w-full border p-2 rounded text-gray-900 bg-white focus:ring-2 focus:ring-gec-orange outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Contact Address</label>
                                <input
                                    value={settings.contactAddress || ""}
                                    onChange={(e) => handleChange("contactAddress", e.target.value)}
                                    className="w-full border p-2 rounded text-gray-900 bg-white focus:ring-2 focus:ring-gec-orange outline-none"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "Landing Page" && (
                    <div className="space-y-6 max-w-3xl">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">Hero Title</label>
                            <input
                                value={settings.heroTitle}
                                onChange={(e) => handleChange("heroTitle", e.target.value)}
                                className="w-full border p-2 rounded text-gray-900 bg-white focus:ring-2 focus:ring-gec-orange outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">Hero Subtitle</label>
                            <textarea
                                value={settings.heroSubtitle}
                                onChange={(e) => handleChange("heroSubtitle", e.target.value)}
                                className="w-full border p-2 rounded h-24 text-gray-900 bg-white focus:ring-2 focus:ring-gec-orange outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">CTA Button Text</label>
                            <input
                                value={settings.buttonText}
                                onChange={(e) => handleChange("buttonText", e.target.value)}
                                className="w-full border p-2 rounded text-gray-900 bg-white focus:ring-2 focus:ring-gec-orange outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">&quot;Why Matters&quot; Section Title</label>
                            <input
                                value={settings.whyMattersTitle || "რატომ არის ეს მნიშვნელოვანი?"}
                                onChange={(e) => handleChange("whyMattersTitle", e.target.value)}
                                className="w-full border p-2 rounded text-gray-900 bg-white focus:ring-2 focus:ring-gec-orange outline-none"
                            />
                        </div>
                    </div>
                )}

                {activeTab === "Assessment" && (
                    <div className="space-y-6 max-w-3xl">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div>
                                <h3 className="text-sm font-bold text-gray-900">OTP Verification</h3>
                                <p className="text-xs text-gray-500">Require email verification code to start assessment.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={settings.requireOtp ?? true}
                                    onChange={(e) => handleChange("requireOtp", e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gec-orange"></div>
                            </label>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">Assessment Page Title</label>
                            <input
                                value={settings.assessmentPageTitle || ""}
                                onChange={(e) => handleChange("assessmentPageTitle", e.target.value)}
                                className="w-full border p-2 rounded text-gray-900 bg-white focus:ring-2 focus:ring-gec-orange outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">Assessment Page Subtitle</label>
                            <input
                                value={settings.assessmentPageSubtitle || ""}
                                onChange={(e) => handleChange("assessmentPageSubtitle", e.target.value)}
                                className="w-full border p-2 rounded text-gray-900 bg-white focus:ring-2 focus:ring-gec-orange outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Prompt: Already took assessment?</label>
                                <input
                                    value={settings.assessmentPromptText || ""}
                                    onChange={(e) => handleChange("assessmentPromptText", e.target.value)}
                                    className="w-full border p-2 rounded text-gray-900 bg-white focus:ring-2 focus:ring-gec-orange outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Button: My Report</label>
                                <input
                                    value={settings.myReportBtnText || ""}
                                    onChange={(e) => handleChange("myReportBtnText", e.target.value)}
                                    className="w-full border p-2 rounded text-gray-900 bg-white focus:ring-2 focus:ring-gec-orange outline-none"
                                />
                            </div>
                        </div>

                        <div className="pt-6 border-t">
                            <h3 className="text-sm font-bold text-gray-900 mb-4">Terms &amp; Conditions</h3>
                            <label className="block text-sm font-medium mb-1 text-gray-700">
                                წესები და პირობები (shown before the assessment starts)
                            </label>
                            <textarea
                                dir="auto"
                                value={settings.termsAndConditionsText || ""}
                                onChange={(e) => handleChange("termsAndConditionsText", e.target.value)}
                                className="w-full border p-2 rounded h-40 text-gray-900 bg-white focus:ring-2 focus:ring-gec-orange outline-none"
                                placeholder="შეფასების გასაგრძელებლად გთხოვთ გაეცნოთ წესებსა და პირობებს და დაეთანხმოთ მათ."
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Users must click &quot;ვეთანხმები&quot; (I agree) to this text before the survey questions appear.
                            </p>
                        </div>
                    </div>
                )}

                {activeTab === "Results & Reports" && (
                    <div className="space-y-6 max-w-3xl">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">Results Page Title</label>
                            <input
                                value={settings.resultPageTitle || ""}
                                onChange={(e) => handleChange("resultPageTitle", e.target.value)}
                                className="w-full border p-2 rounded text-gray-900 bg-white focus:ring-2 focus:ring-gec-orange outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Label: Organization</label>
                                <input
                                    value={settings.resultOrganizationLabel || ""}
                                    onChange={(e) => handleChange("resultOrganizationLabel", e.target.value)}
                                    className="w-full border p-2 rounded text-gray-900 bg-white focus:ring-2 focus:ring-gec-orange outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Label: Score</label>
                                <input
                                    value={settings.resultScoreLabel || ""}
                                    onChange={(e) => handleChange("resultScoreLabel", e.target.value)}
                                    className="w-full border p-2 rounded text-gray-900 bg-white focus:ring-2 focus:ring-gec-orange outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Button: Individual Report</label>
                                <input
                                    value={settings.resultPersonalReportBtn || ""}
                                    onChange={(e) => handleChange("resultPersonalReportBtn", e.target.value)}
                                    className="w-full border p-2 rounded text-gray-900 bg-white focus:ring-2 focus:ring-gec-orange outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Button: Company Report</label>
                                <input
                                    value={settings.resultCompanyReportBtn || ""}
                                    onChange={(e) => handleChange("resultCompanyReportBtn", e.target.value)}
                                    className="w-full border p-2 rounded text-gray-900 bg-white focus:ring-2 focus:ring-gec-orange outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Button: Download PDF</label>
                                <input
                                    value={settings.resultDownloadBtnText || ""}
                                    onChange={(e) => handleChange("resultDownloadBtnText", e.target.value)}
                                    className="w-full border p-2 rounded text-gray-900 bg-white focus:ring-2 focus:ring-gec-orange outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Button: Restart</label>
                                <input
                                    value={settings.resultRestartBtnText || ""}
                                    onChange={(e) => handleChange("resultRestartBtnText", e.target.value)}
                                    className="w-full border p-2 rounded text-gray-900 bg-white focus:ring-2 focus:ring-gec-orange outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Text: No Data</label>
                                <input
                                    value={settings.resultNoDataText || ""}
                                    onChange={(e) => handleChange("resultNoDataText", e.target.value)}
                                    className="w-full border p-2 rounded text-gray-900 bg-white focus:ring-2 focus:ring-gec-orange outline-none"
                                />
                            </div>
                        </div>

                        <div className="pt-6 border-t">
                            <h3 className="text-sm font-bold text-gray-900 mb-4">Phase Details Labels</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700">Label: Essence</label>
                                    <input
                                        value={settings.phaseEssenceLabel || ""}
                                        onChange={(e) => handleChange("phaseEssenceLabel", e.target.value)}
                                        className="w-full border p-2 rounded text-gray-900 bg-white focus:ring-2 focus:ring-gec-orange outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700">Label: Characteristics</label>
                                    <input
                                        value={settings.phaseCharacteristicsLabel || ""}
                                        onChange={(e) => handleChange("phaseCharacteristicsLabel", e.target.value)}
                                        className="w-full border p-2 rounded text-gray-900 bg-white focus:ring-2 focus:ring-gec-orange outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700">Label: Focus</label>
                                    <input
                                        value={settings.phaseFocusLabel || ""}
                                        onChange={(e) => handleChange("phaseFocusLabel", e.target.value)}
                                        className="w-full border p-2 rounded text-gray-900 bg-white focus:ring-2 focus:ring-gec-orange outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t">
                            <h3 className="text-sm font-bold text-gray-900 mb-4">Meeting Booking</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700">Booking Text</label>
                                    <textarea
                                        value={settings.bookingText || ""}
                                        onChange={(e) => handleChange("bookingText", e.target.value)}
                                        className="w-full border p-2 rounded h-24 text-gray-900 bg-white focus:ring-2 focus:ring-gec-orange outline-none"
                                        placeholder="თუ გსურთ დამატებითი განხილვა GEC-ის გუნდთან..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700">Booking Link</label>
                                    <input
                                        value={settings.bookingLink || ""}
                                        onChange={(e) => handleChange("bookingLink", e.target.value)}
                                        className="w-full border p-2 rounded text-gray-900 bg-white focus:ring-2 focus:ring-gec-orange outline-none"
                                        placeholder="https://outlook.office.com/book/..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

