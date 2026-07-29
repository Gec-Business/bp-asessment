
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const questions = await prisma.question.findMany({
        include: {
            answers: true
        },
        orderBy: { order: 'asc' }
    });

    console.log("--- START QUESTION DUMP ---");
    questions.forEach(q => {
        console.log(`Q${q.id}: ${q.text}`);
        q.answers.forEach((a, idx) => {
            console.log(`  Opt ${idx + 1}: "${a.text}" (Score: ${a.score})`);
        });
    });
    console.log("--- END QUESTION DUMP ---");
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
