export type Locale = "en" | "ka";

export const LOCALES: Locale[] = ["en", "ka"];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "locale";

export function isLocale(value: string | undefined | null): value is Locale {
    return value === "en" || value === "ka";
}

export function normalizeLocale(value: string | undefined | null): Locale {
    return isLocale(value) ? value : DEFAULT_LOCALE;
}

// Parses a raw `Accept-Language` header (e.g. "ka-GE,ka;q=0.9,en-US;q=0.8")
// and returns whichever of our supported locales the browser prefers most.
// Falls back to DEFAULT_LOCALE when neither is present in the header.
export function detectLocaleFromAcceptLanguage(header: string | null | undefined): Locale {
    if (!header) return DEFAULT_LOCALE;

    const ranked = header
        .split(",")
        .map((part) => {
            const [tag, ...params] = part.trim().split(";");
            const qParam = params.find((p) => p.trim().startsWith("q="));
            const q = qParam ? parseFloat(qParam.trim().slice(2)) : 1;
            const lang = tag.split("-")[0].toLowerCase();
            return { lang, q: isNaN(q) ? 1 : q };
        })
        .sort((a, b) => b.q - a.q);

    for (const { lang } of ranked) {
        if (isLocale(lang)) return lang;
    }
    return DEFAULT_LOCALE;
}
