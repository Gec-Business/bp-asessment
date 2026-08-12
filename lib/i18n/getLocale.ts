import { cookies, headers } from "next/headers";
import { LOCALE_COOKIE, detectLocaleFromAcceptLanguage, isLocale, type Locale } from "./locales";

// No stored preference yet -> infer from the browser's Accept-Language
// header instead of always defaulting to English. Once the user picks (or
// dismisses the language prompt), the cookie takes over and this is skipped.
export function getLocale(): Locale {
    const stored = cookies().get(LOCALE_COOKIE)?.value;
    if (isLocale(stored)) return stored;
    return detectLocaleFromAcceptLanguage(headers().get("accept-language"));
}

export function hasStoredLocale(): boolean {
    return isLocale(cookies().get(LOCALE_COOKIE)?.value);
}
