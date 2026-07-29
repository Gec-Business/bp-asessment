
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Connecting to database...');
        const settings = await prisma.globalSettings.findFirst();
        console.log('Settings found:', settings);
    } catch (e) {
        console.error('Database Connection Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
