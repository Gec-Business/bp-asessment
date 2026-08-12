import { NextRequest } from "next/server";
import { LOCALE_COOKIE, detectLocaleFromAcceptLanguage, isLocale, type Locale } from "./locales";

export function getLocaleFromRequest(req: NextRequest): Locale {
    const stored = req.cookies.get(LOCALE_COOKIE)?.value;
    if (isLocale(stored)) return stored;
    return detectLocaleFromAcceptLanguage(req.headers.get("accept-language"));
}
