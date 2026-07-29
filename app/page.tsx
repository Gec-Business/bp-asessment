import EvolutionPath from "@/components/EvolutionPath";
import Link from "next/link";
import Image from "next/image";
import WhyMatters from "@/components/WhyMatters";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import { StartAssessmentButton, MyReportButton } from "@/components/ActionButtons";

// Force dynamic since we read from DB and settings might change
export const dynamic = 'force-dynamic';

async function getGlobalSettings() {
    try {
        let settings = await prisma.globalSettings.findFirst();
        if (!settings) {
            // Default Fallback
            return {
                heroTitle: "ბიზნეს პროცესების სიმწიფის შეფასება",
                heroSubtitle: "განსაზღვრეთ თქვენი კომპანიის განვითარების ეტაპი და მიიღეთ რეკომენდაციები შემდეგი ნაბიჯებისთვის.",
                buttonText: "შეფასების დაწყება",
                logoUrl: "/logo.png",
                footerText: "© 2026 GEC Business. All rights reserved.",
                contactEmail: "",
                contactAddress: "",
                logoWidth: 256,
                // Defaults for new fields
                myReportBtnText: "ჩემი ანგარიში",
                assessmentPromptText: "უკვე გავლილი გაქვთ თვითშეფასება? ეწვიეთ ამ ბმულს:",
                whyMattersTitle: "რატომ არის ეს მნიშვნელოვანი?",
                phaseEssenceLabel: "არსი",
                phaseCharacteristicsLabel: "მახასიათებლები",
                phaseFocusLabel: "ფოკუსი"
            };
        }
        return settings;
    } catch (e) {
        console.error("Failed to fetch settings", e);
        return {
            heroTitle: "ბიზნეს პროცესების სიმწიფის შეფასება",
            heroSubtitle: "Error loading settings...",
            buttonText: "შეფასების დაწყება",
            logoUrl: "/logo.png",
            footerText: "© 2026 GEC Business",
            contactEmail: "",
            contactAddress: "",
            logoWidth: 256,
            myReportBtnText: "ჩემი ანგარიში",
            assessmentPromptText: "უკვე გავლილი გაქვთ თვითშეფასება? ეწვიეთ ამ ბმულს:",
            whyMattersTitle: "რატომ არის ეს მნიშვნელოვანი?",
            phaseEssenceLabel: "არსი",
            phaseCharacteristicsLabel: "მახასიათებლები",
            phaseFocusLabel: "ფოკუსი"
        };
    }
}

async function getWhyItems() {
    try {
        return await prisma.whyItem.findMany({ orderBy: { order: 'asc' } });
    } catch (e) {
        console.error("Failed to fetch why items", e);
        return [];
    }
}

export default async function Home() {
    const settings = await getGlobalSettings();
    const whyItems = await getWhyItems();

    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-8 bg-gec-navy text-gec-white bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-gec-navy to-black overflow-hidden selection:bg-gec-orange selection:text-white">
            <Header initialSettings={settings} />

            <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm flex flex-col gap-10">
                {/* Hero Title Fix: Padding & Line Height */}
                <div className="relative z-10 w-full flex flex-col items-center">
                    {/* Ambient Glows behind text */}
                    <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] -z-10 animate-pulse"></div>
                    <div className="absolute top-0 left-1/4 w-64 h-64 bg-teal-500/10 rounded-full blur-[100px] -z-10"></div>

                    <h1 className="text-4xl md:text-6xl font-extrabold text-center mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-100 to-gray-300 drop-shadow-[0_0_25px_rgba(255,255,255,0.2)] leading-normal py-2 tracking-tight">
                        {settings.heroTitle}
                    </h1>

                    <p className="text-lg md:text-xl text-center max-w-3xl text-gray-200 mb-10 leading-relaxed text-balance font-sans">
                        {settings.heroSubtitle}
                    </p>
                </div>

                <section className="w-full my-8">
                    <EvolutionPath labels={{
                        essence: settings.phaseEssenceLabel,
                        characteristics: settings.phaseCharacteristicsLabel,
                        focus: settings.phaseFocusLabel
                    }} />
                </section>

                <div className="flex flex-col items-center gap-4 mb-12">
                    <div className="flex items-center justify-center gap-2 mb-2 text-gec-yellow max-w-xl text-center px-4">
                        <span className="text-sm md:text-base font-medium">
                            კომპანიის გაერთიანებულ შედეგებში არ გამოჩნდება თქვენი სახელი.
                        </span>
                    </div>
                    <StartAssessmentButton text={settings.buttonText} />

                    <div className="flex flex-col items-center gap-2 mt-2">
                        <span className="text-white/60 text-sm">{settings.assessmentPromptText || "უკვე გავლილი გაქვთ თვითშეფასება? ეწვიეთ ამ ბმულს:"}</span>
                        <MyReportButton text={settings.myReportBtnText || "ჩემი ანგარიში"} />
                    </div>
                </div>

                {/* Why Matters Section */}
                <WhyMatters items={whyItems} title={settings.whyMattersTitle} />
            </div>

            <footer className="w-full max-w-5xl flex flex-col justify-center items-center mt-12 text-sm opacity-50 gap-2">
                <p>{settings.footerText}</p>
                {(settings.contactEmail || settings.contactAddress) && (
                    <div className="flex gap-4 text-xs">
                        {settings.contactEmail && <span>{settings.contactEmail}</span>}
                        {settings.contactAddress && <span>{settings.contactAddress}</span>}
                    </div>
                )}
            </footer>
        </main>
    );
}

