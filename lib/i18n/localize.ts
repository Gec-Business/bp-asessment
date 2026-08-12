import type { Answer, GlobalSettings, LandingStep, Phase, Question, WhyItem } from "@prisma/client";
import type { Locale } from "./locales";

function pick(locale: Locale, en: string, ka: string | null | undefined): string {
    return locale === "ka" ? (ka || en) : en;
}

function pickNullable(locale: Locale, en: string | null | undefined, ka: string | null | undefined) {
    return locale === "ka" ? (ka ?? en ?? null) : (en ?? null);
}

export function localizeAnswer<T extends Answer>(answer: T, locale: Locale) {
    return { ...answer, text: pick(locale, answer.text, answer.textKa) };
}

export function localizeQuestion<T extends Question & { answers?: Answer[] }>(question: T, locale: Locale) {
    return {
        ...question,
        text: pick(locale, question.text, question.textKa),
        shortLabel: pick(locale, question.shortLabel, question.shortLabelKa),
        construct: pickNullable(locale, question.construct, question.constructKa),
        ...(question.answers ? { answers: question.answers.map((a) => localizeAnswer(a, locale)) } : {}),
    };
}

export function localizePhase<T extends Phase>(phase: T, locale: Locale) {
    return {
        ...phase,
        title: pick(locale, phase.title, phase.titleKa),
        subtitle: pick(locale, phase.subtitle, phase.subtitleKa),
        essence: pick(locale, phase.essence, phase.essenceKa),
        characteristics: pick(locale, phase.characteristics, phase.characteristicsKa),
        focus: pick(locale, phase.focus, phase.focusKa),
        challenges: pick(locale, phase.challenges, phase.challengesKa),
        meaningPoints: pick(locale, phase.meaningPoints, phase.meaningPointsKa),
        manifestation: pick(locale, phase.manifestation, phase.manifestationKa),
        benefits: pick(locale, phase.benefits, phase.benefitsKa),
        recommendations: pick(locale, phase.recommendations, phase.recommendationsKa),
    };
}

export function localizeLandingStep<T extends LandingStep>(step: T, locale: Locale) {
    return {
        ...step,
        title: pick(locale, step.title, step.titleKa),
        subtitle: pick(locale, step.subtitle, step.subtitleKa),
        description: pick(locale, step.description, step.descriptionKa),
    };
}

export function localizeWhyItem<T extends WhyItem>(item: T, locale: Locale) {
    return {
        ...item,
        title: pick(locale, item.title, item.titleKa),
        description: pick(locale, item.description, item.descriptionKa),
    };
}

const GLOBAL_SETTINGS_TRANSLATABLE_FIELDS = [
    "heroTitle", "heroSubtitle", "buttonText", "footerText", "contactAddress",
    "assessmentPageTitle", "assessmentPageSubtitle", "assessmentPromptText",
    "myReportBtnText", "whyMattersTitle", "termsAndConditionsText",
    "resultPageTitle", "resultPersonalReportBtn", "resultCompanyReportBtn",
    "resultOrganizationLabel", "resultScoreLabel", "resultDownloadBtnText",
    "resultRestartBtnText", "resultNoDataText", "phaseEssenceLabel",
    "phaseCharacteristicsLabel", "phaseFocusLabel", "bookingText",
] as const;

export function localizeGlobalSettings<T extends GlobalSettings>(settings: T, locale: Locale) {
    const result: any = { ...settings };
    for (const field of GLOBAL_SETTINGS_TRANSLATABLE_FIELDS) {
        const kaField = `${field}Ka` as keyof T;
        result[field] = locale === "ka" ? ((settings[kaField] as unknown as string) || settings[field]) : settings[field];
    }
    return result as T;
}
