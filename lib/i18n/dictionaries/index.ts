import type { Locale } from "../locales";
import en from "./en";
import ka from "./ka";
import type { Dictionary } from "./en";

export type { Dictionary };

const dictionaries: Record<Locale, Dictionary> = { en, ka };

export function getDictionary(locale: Locale): Dictionary {
    return dictionaries[locale];
}
