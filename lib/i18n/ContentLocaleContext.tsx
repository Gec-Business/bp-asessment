"use client";

// Separate from the public `LocaleProvider` cookie: this controls which
// language's fields an admin is viewing/editing in the content managers
// (Questions, Phases, Landing Steps, Global Settings, Why-Matters). The
// admin chrome itself always stays English regardless of this value.
import { createContext, useContext, useEffect, useState } from "react";
import { DEFAULT_LOCALE, type Locale } from "./locales";

const STORAGE_KEY = "admin-content-locale";

type ContentLocaleContextValue = {
    contentLocale: Locale;
    setContentLocale: (locale: Locale) => void;
};

const ContentLocaleContext = createContext<ContentLocaleContextValue | null>(null);

export function ContentLocaleProvider({ children }: { children: React.ReactNode }) {
    const [contentLocale, setContentLocaleState] = useState<Locale>(DEFAULT_LOCALE);

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === "en" || stored === "ka") setContentLocaleState(stored);
    }, []);

    const setContentLocale = (locale: Locale) => {
        localStorage.setItem(STORAGE_KEY, locale);
        setContentLocaleState(locale);
    };

    return (
        <ContentLocaleContext.Provider value={{ contentLocale, setContentLocale }}>
            {children}
        </ContentLocaleContext.Provider>
    );
}

export function useContentLocale() {
    const ctx = useContext(ContentLocaleContext);
    if (!ctx) throw new Error("useContentLocale must be used within a ContentLocaleProvider");
    return ctx;
}

// Helper for manager components: resolves the field key to edit/display
// based on the current content locale ("en" -> base field, "ka" -> `${field}Ka`).
export function fieldKey(field: string, contentLocale: Locale): string {
    return contentLocale === "ka" ? `${field}Ka` : field;
}
