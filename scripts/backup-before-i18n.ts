// One-off logical backup of every content-bearing table before the i18n schema
// migration. No pg_dump/psql/Neon CLI is available in this environment, so this
// substitutes a Prisma-driven JSON export as the pre-migration safety net.
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
    const [questions, answers, phases, landingSteps, globalSettings, whyItems, leads, results] = await Promise.all([
        prisma.question.findMany(),
        prisma.answer.findMany(),
        prisma.phase.findMany(),
        prisma.landingStep.findMany(),
        prisma.globalSettings.findMany(),
        prisma.whyItem.findMany(),
        prisma.lead.findMany(),
        prisma.result.findMany(),
    ]);

    const backup = { questions, answers, phases, landingSteps, globalSettings, whyItems, leads, results };
    const outDir = path.join(process.cwd(), "backups");
    fs.mkdirSync(outDir, { recursive: true });
    const outFile = path.join(outDir, `pre-i18n-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
    fs.writeFileSync(outFile, JSON.stringify(backup, null, 2), "utf-8");

    console.log(`Backed up ${questions.length} questions, ${answers.length} answers, ${phases.length} phases, ${landingSteps.length} landing steps, ${globalSettings.length} global settings, ${whyItems.length} why-items, ${leads.length} leads, ${results.length} results.`);
    console.log(`Written to: ${outFile}`);
}

main()
    .catch((e) => {
        console.error("Backup failed:", e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
