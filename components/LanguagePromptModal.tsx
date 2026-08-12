"use client";

import { usePathname } from "next/navigation";
import { useLocale } from "@/lib/i18n/LocaleProvider";

// First-visit language prompt. Text is intentionally bilingual (not routed
// through the dictionary) since the visitor's language preference isn't
// confirmed yet — that's the whole point of this component.
export default function LanguagePromptModal() {
    const pathname = usePathname();
    const { showLanguagePrompt, setLocale, dismissLanguagePrompt } = useLocale();

    // Admin chrome always stays English and isn't a "first-time visitor"
    // context, so never show the public language prompt there.
    if (pathname?.startsWith("/admin") || pathname === "/login") return null;
    if (!showLanguagePrompt) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn"
            role="dialog"
            aria-modal="true"
            aria-label="Language selection / ენის არჩევა"
            onClick={dismissLanguagePrompt}
        >
            <div
                className="bg-white dark:bg-gec-navy rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center border border-gray-100 dark:border-gec-teal"
                onClick={(e) => e.stopPropagation()}
            >
                <p className="text-xl font-bold text-gec-navy dark:text-white">Select your language</p>
                <p className="text-xl font-bold text-gec-navy dark:text-white mb-6">აირჩიეთ ენა</p>

                <div className="flex flex-col gap-3">
                    <button
                        type="button"
                        onClick={() => setLocale("en")}
                        className="w-full px-6 py-3.5 rounded-xl font-bold text-lg bg-gec-orange text-white hover:opacity-90 transition-opacity shadow-sm"
                    >
                        English
                    </button>
                    <button
                        type="button"
                        onClick={() => setLocale("ka")}
                        className="w-full px-6 py-3.5 rounded-xl font-bold text-lg border-2 border-gec-orange text-gec-orange hover:bg-gec-orange/10 transition-colors"
                    >
                        ქართული
                    </button>
                </div>
            </div>
        </div>
    );
}
