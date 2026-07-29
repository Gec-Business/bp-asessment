"use client";

import { useEffect, useState } from "react";

type Settings = {
    footerText: string;
    contactEmail: string;
    contactAddress: string;
};

export default function Footer({ initialSettings }: { initialSettings?: Settings }) {
    const [settings, setSettings] = useState<Settings>(initialSettings || {
        footerText: "© 2026 GEC Business. All rights reserved.",
        contactEmail: "info@gec-consulting.com",
        contactAddress: "Tbilisi, Georgia"
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
        <footer className="w-full flex flex-col justify-center items-center py-8 text-sm opacity-50 gap-2 bg-transparent text-white">
            <p>{settings.footerText}</p>
            {(settings.contactEmail || settings.contactAddress) && (
                <div className="flex gap-4 text-xs">
                    {settings.contactEmail && <span>{settings.contactEmail}</span>}
                    {settings.contactAddress && <span>{settings.contactAddress}</span>}
                </div>
            )}
        </footer>
    );
}
