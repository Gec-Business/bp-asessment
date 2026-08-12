// One-time backfill: copies each row's current (Georgian) text into the new
// *Ka columns, then overwrites the base columns with the English translation.
// Must run AFTER the *Ka columns exist (prisma db push) and BEFORE any admin
// edits the base fields expecting them to already mean English.
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const translationsDir = path.join(process.cwd(), "scripts", "translations");
function readJson(file: string): any {
    return JSON.parse(fs.readFileSync(path.join(translationsDir, file), "utf-8"));
}

const questionsAnswers: any = readJson("questions-answers.json");
const phasesTranslation: any = readJson("phases.json");
const landingWhySettings: any = readJson("landing-why-settings.json");

const prisma = new PrismaClient();

async function backfillQuestions() {
    const qMap = new Map<number, any>(questionsAnswers.questions.map((q: any) => [q.id, q]));
    const aMap = new Map<number, any>(questionsAnswers.answers.map((a: any) => [a.id, a]));

    const questions = await prisma.question.findMany();
    for (const q of questions) {
        const t = qMap.get(q.id);
        if (!t) { console.warn(`No translation for question id=${q.id}`); continue; }
        await prisma.question.update({
            where: { id: q.id },
            data: {
                textKa: q.text,
                shortLabelKa: q.shortLabel,
                constructKa: q.construct,
                text: t.text,
                shortLabel: t.shortLabel,
                construct: t.construct,
            },
        });
    }

    const answers = await prisma.answer.findMany();
    for (const a of answers) {
        const t = aMap.get(a.id);
        if (!t) { console.warn(`No translation for answer id=${a.id}`); continue; }
        await prisma.answer.update({
            where: { id: a.id },
            data: { textKa: a.text, text: t.text },
        });
    }
    console.log(`Backfilled ${questions.length} questions, ${answers.length} answers.`);
}

async function backfillPhases() {
    const pMap = new Map<number, any>(phasesTranslation.phases.map((p: any) => [p.id, p]));
    const phases = await prisma.phase.findMany();
    for (const p of phases) {
        const t = pMap.get(p.id);
        if (!t) { console.warn(`No translation for phase id=${p.id}`); continue; }
        await prisma.phase.update({
            where: { id: p.id },
            data: {
                titleKa: p.title,
                subtitleKa: p.subtitle,
                essenceKa: p.essence,
                characteristicsKa: p.characteristics,
                focusKa: p.focus,
                challengesKa: p.challenges,
                meaningPointsKa: p.meaningPoints,
                manifestationKa: p.manifestation,
                benefitsKa: p.benefits,
                recommendationsKa: p.recommendations,
                title: t.title,
                subtitle: t.subtitle,
                essence: t.essence,
                characteristics: JSON.stringify(t.characteristics),
                focus: t.focus,
                challenges: JSON.stringify(t.challenges),
                meaningPoints: JSON.stringify(t.meaningPoints),
                manifestation: JSON.stringify(t.manifestation),
                benefits: JSON.stringify(t.benefits),
                recommendations: t.recommendations,
            },
        });
    }
    console.log(`Backfilled ${phases.length} phases.`);
}

async function backfillLandingSteps() {
    const sMap = new Map<number, any>(landingWhySettings.landingSteps.map((s: any) => [s.id, s]));
    const steps = await prisma.landingStep.findMany();
    for (const s of steps) {
        const t = sMap.get(s.id);
        if (!t) { console.warn(`No translation for landing step id=${s.id}`); continue; }
        await prisma.landingStep.update({
            where: { id: s.id },
            data: {
                titleKa: s.title,
                subtitleKa: s.subtitle,
                descriptionKa: s.description,
                title: t.title,
                subtitle: t.subtitle,
                description: JSON.stringify(t.description),
            },
        });
    }
    console.log(`Backfilled ${steps.length} landing steps.`);
}

async function backfillWhyItems() {
    const wMap = new Map<string, any>(landingWhySettings.whyItems.map((w: any) => [w.id, w]));
    const items = await prisma.whyItem.findMany();
    for (const w of items) {
        const t = wMap.get(w.id);
        if (!t) { console.warn(`No translation for why-item id=${w.id}`); continue; }
        await prisma.whyItem.update({
            where: { id: w.id },
            data: {
                titleKa: w.title,
                descriptionKa: w.description,
                title: t.title,
                description: t.description,
            },
        });
    }
    console.log(`Backfilled ${items.length} why-items.`);
}

const SETTINGS_FIELDS: string[] = Object.keys(landingWhySettings.globalSettings);

async function backfillGlobalSettings() {
    const settings = await prisma.globalSettings.findFirst();
    if (!settings) { console.warn("No GlobalSettings row found."); return; }

    const data: Record<string, string> = {};
    for (const field of SETTINGS_FIELDS) {
        const current = (settings as any)[field] as string | null;
        const translated = landingWhySettings.globalSettings[field];
        data[`${field}Ka`] = current ?? "";
        data[field] = translated;
    }

    await prisma.globalSettings.update({ where: { id: settings.id }, data });
    console.log(`Backfilled GlobalSettings (${SETTINGS_FIELDS.length} fields).`);
}

async function main() {
    await backfillQuestions();
    await backfillPhases();
    await backfillLandingSteps();
    await backfillWhyItems();
    await backfillGlobalSettings();
}

main()
    .catch((e) => {
        console.error("Backfill failed:", e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
