"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLocale } from "@/lib/i18n/LocaleProvider";

type Settings = {
    logoUrl: string;
    logoWidth?: number;
};

function LanguageSwitcher() {
    const { locale, setLocale } = useLocale();

    return (
        <div className="flex items-center gap-1 rounded-full border border-gray-200 dark:border-gray-700 p-1 text-sm font-semibold">
            <button
                type="button"
                onClick={() => setLocale("en")}
                aria-pressed={locale === "en"}
                className={`px-3 py-1 rounded-full transition-colors ${locale === "en" ? "bg-[#F05324] text-white" : "text-gray-500 hover:text-gray-900 dark:hover:text-white"}`}
            >
                EN
            </button>
            <button
                type="button"
                onClick={() => setLocale("ka")}
                aria-pressed={locale === "ka"}
                className={`px-3 py-1 rounded-full transition-colors ${locale === "ka" ? "bg-[#F05324] text-white" : "text-gray-500 hover:text-gray-900 dark:hover:text-white"}`}
            >
                KA
            </button>
        </div>
    );
}

export default function Header({ initialSettings }: { initialSettings?: Settings }) {
    const [settings, setSettings] = useState<Settings>(initialSettings || {
        logoUrl: "/logo.png",
        logoWidth: 256
    });

    useEffect(() => {
        if (!initialSettings) {
            fetch("/api/admin/settings")
                .then(res => res.json())
                .then(data => {
                    if (data && !data.error) setSettings(data);
                })
                .catch(err => console.error(err));
        }
    }, [initialSettings]);

    return (
        <header className="w-full flex justify-center md:justify-between items-center py-8 px-6 max-w-7xl mx-auto relative z-20">
            {/* Language switcher: absolute on mobile so it doesn't disturb the centered logo, static spacer on desktop */}
            <div className="absolute left-4 top-6 md:static md:w-24 md:flex md:items-center md:justify-start">
                <LanguageSwitcher />
            </div>

            <Link href="/" className="text-3xl font-bold tracking-tighter cursor-pointer">
                {settings.logoUrl ? (
                    <div className="flex items-center gap-2">
                        {settings.logoUrl.length > 50 || settings.logoUrl.includes("data:image") ? (
                            <div 
                                className="relative hover:scale-105 transition-transform duration-300"
                                style={{ width: `${settings.logoWidth || 256}px`, height: `${(settings.logoWidth || 256) * (96/256)}px` }}
                            >
                                <Image
                                    src={settings.logoUrl}
                                    alt="Logo"
                                    fill
                                    className="object-contain object-center"
                                    sizes="(max-width: 768px) 100vw, 300px"
                                    priority
                                />
                            </div>
                        ) : (
                            <div 
                                className="relative hover:scale-105 transition-transform duration-300 flex items-center justify-center"
                                style={{ width: `${settings.logoWidth || 256}px`, height: `${(settings.logoWidth || 256) * (96/256)}px` }}
                            >
                                <Image
                                    src={settings.logoUrl}
                                    alt="Logo"
                                    fill
                                    className="object-contain object-center"
                                    sizes="(max-width: 768px) 100vw, 300px"
                                    priority
                                />
                            </div>
                        )}
                    </div>
                ) : (
                    <span className="text-white">GEC Business</span>
                )}
            </Link>

            {/* Spacer to balance layout */}
            <div className="w-24 hidden md:block"></div>
        </header>
    );
}
