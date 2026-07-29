"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type Settings = {
    logoUrl: string;
    logoWidth?: number;
};

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
            {/* Spacer to balance logo */}
            <div className="w-24 hidden md:block"></div>

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
