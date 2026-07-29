"use client";

import Link from "next/link";
import { useState } from "react";

export function StartAssessmentButton({ text }: { text: string }) {
    const [loading, setLoading] = useState(false);

    return (
        <Link
            href="/assessment"
            onClick={() => setLoading(true)}
            className={`group rounded-full border border-transparent px-8 py-4 bg-gec-orange text-white text-lg font-bold transition-all hover:bg-white hover:text-gec-orange hover:shadow-lg hover:scale-105 active:scale-95 flex items-center justify-center gap-3 ${loading ? 'opacity-70 pointer-events-none' : ''}`}
        >
            {loading && (
                <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            )}
            {text}
        </Link>
    );
}

export function MyReportButton({ text }: { text: string }) {
    const [loading, setLoading] = useState(false);

    return (
        <Link
            href="/my-report"
            onClick={() => setLoading(true)}
            className={`rounded-full border border-white/30 px-8 py-3 text-white/80 text-base font-medium transition-all hover:bg-white/10 hover:border-white hover:text-white flex items-center justify-center gap-2 ${loading ? 'opacity-70 pointer-events-none' : ''}`}
        >
            {loading && (
                <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            )}
            {text}
        </Link>
    );
}
