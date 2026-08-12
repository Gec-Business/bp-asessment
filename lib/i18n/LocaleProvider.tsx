"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LOCALE_COOKIE, type Locale } from "./locales";
import { getDictionary, type Dictionary } from "./dictionaries";

type LocaleContextValue = {
    locale: Locale;
    dictionary: Dictionary;
    setLocale: (locale: Locale) => void;
    showLanguagePrompt: boolean;
    dismissLanguagePrompt: () => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ initialLocale, hasStoredLocale, children }: { initialLocale: Locale; hasStoredLocale: boolean; children: React.ReactNode }) {
    const router = useRouter();
    const [locale, setLocaleState] = useState<Locale>(initialLocale);
    const [promptDismissed, setPromptDismissed] = useState(false);

    const writeCookie = (next: Locale) => {
        document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; SameSite=Lax`;
    };

    const setLocale = useCallback((next: Locale) => {
        writeCookie(next);
        setLocaleState(next);
        setPromptDismissed(true);
        router.refresh();
    }, [router]);

    // Dismissing without picking (e.g. clicking the backdrop) still confirms
    // whatever locale is currently active (auto-detected from the browser),
    // so the prompt doesn't reappear on the next visit.
    const dismissLanguagePrompt = useCallback(() => {
        writeCookie(locale);
        setPromptDismissed(true);
    }, [locale]);

    return (
        <LocaleContext.Provider value={{
            locale,
            dictionary: getDictionary(locale),
            setLocale,
            showLanguagePrompt: !hasStoredLocale && !promptDismissed,
            dismissLanguagePrompt,
        }}>
            {children}
        </LocaleContext.Provider>
    );
}

export function useLocale() {
    const ctx = useContext(LocaleContext);
    if (!ctx) throw new Error("useLocale must be used within a LocaleProvider");
    return ctx;
}

export function useDictionary() {
    return useLocale().dictionary;
}
