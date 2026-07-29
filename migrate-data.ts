import sqlite3 from 'sqlite3';
import { PrismaClient } from '@prisma/client';

// Path to your local SQLite database
const SQLITE_DB_PATH = './prisma/dev.db';

// The Postgres client (Neon) - uses url from .env automatically
const prisma = new PrismaClient();

async function migrateData() {
    console.log('Starting migration from SQLite to Postgres...');

    // 1. Connect to SQLite
    const db = new sqlite3.Database(SQLITE_DB_PATH, sqlite3.OPEN_READONLY, (err) => {
        if (err) {
            console.error('Error opening SQLite database:', err.message);
            process.exit(1);
        }
    });

    // Helper syntax to promisify SQLite queries
    const fetchAll = (query: string): Promise<any[]> => {
        return new Promise((resolve, reject) => {
            db.all(query, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    };

    try {
        // 2. Fetch all data from SQLite
        console.log('Fetching data from SQLite...');
        const users = await fetchAll('SELECT * FROM User');
        const leads = await fetchAll('SELECT * FROM Lead');
        const results = await fetchAll('SELECT * FROM Result');
        const questions = await fetchAll('SELECT * FROM Question');
        const answers = await fetchAll('SELECT * FROM Answer');
        const phases = await fetchAll('SELECT * FROM Phase');
        const landingSteps = await fetchAll('SELECT * FROM LandingStep');
        const globalSettings = await fetchAll('SELECT * FROM GlobalSettings');
        const systemTexts = await fetchAll('SELECT * FROM SystemText');
        const whyItems = await fetchAll('SELECT * FROM WhyItem');
        const otpVerifications = await fetchAll('SELECT * FROM OtpVerification');

        console.log(`Fetched ${users.length} Users, ${leads.length} Leads, ${results.length} Results, ${questions.length} Questions, ${answers.length} Answers, ${phases.length} Phases, ${landingSteps.length} LandingSteps, ${globalSettings.length} GlobalSettings, ${systemTexts.length} SystemTexts, ${whyItems.length} WhyItems, ${otpVerifications.length} OtpVerifications`);

        // 3. Insert into Postgres using a transaction
        console.log('Inserting data into Postgres...');

        await prisma.$transaction(async (tx) => {
            // Delete existing data to prevent conflicts during migration
            await tx.otpVerification.deleteMany({});
            await tx.whyItem.deleteMany({});
            await tx.systemText.deleteMany({});
            await tx.globalSettings.deleteMany({});
            await tx.landingStep.deleteMany({});
            await tx.phase.deleteMany({});
            await tx.answer.deleteMany({});
            await tx.question.deleteMany({});
            await tx.result.deleteMany({});
            await tx.lead.deleteMany({});

            // Delete Users EXCEPT the ones that might already exist in Postgres to prevent deleting admins
            // This is complex. Best approach: If user doesn't exist by email, insert.
            // Since we can't easily upsert many in a single batch safely with different IDs, we'll do it sequentially for Users.

            for (const user of users) {
                const existing = await tx.user.findUnique({ where: { email: user.email } });
                if (!existing) {
                    await tx.user.create({
                        data: {
                            id: user.id,
                            email: user.email,
                            password: user.password,
                            createdAt: new Date(user.createdAt),
                            updatedAt: new Date(user.updatedAt)
                        }
                    });
                } else {
                    console.log(`User ${user.email} already exists in Postgres. Skipping.`);
                }
            }

            // Insert other tables sequentially safely (createMany is not supported on SQLite by default but this is inserting into Postgres, so createMany works)

            if (leads.length > 0) {
                await tx.lead.createMany({
                    data: leads.map(l => ({ ...l, createdAt: new Date(l.createdAt) }))
                });
            }

            if (results.length > 0) {
                await tx.result.createMany({
                    data: results.map(r => ({ ...r, createdAt: new Date(r.createdAt) }))
                });
            }

            if (questions.length > 0) {
                await tx.question.createMany({
                    data: questions
                });
            }

            if (answers.length > 0) {
                await tx.answer.createMany({
                    data: answers
                });
            }

            if (phases.length > 0) {
                await tx.phase.createMany({
                    data: phases
                });
            }

            if (landingSteps.length > 0) {
                await tx.landingStep.createMany({
                    data: landingSteps
                });
            }

            if (globalSettings.length > 0) {
                await tx.globalSettings.createMany({
                    data: globalSettings.map(gs => ({
                        ...gs,
                        requireOtp: Boolean(gs.requireOtp)
                    }))
                });
            }

            if (systemTexts.length > 0) {
                await tx.systemText.createMany({
                    data: systemTexts
                });
            }

            if (whyItems.length > 0) {
                await tx.whyItem.createMany({
                    data: whyItems
                });
            }

            if (otpVerifications.length > 0) {
                await tx.otpVerification.createMany({
                    data: otpVerifications.map(o => ({ ...o, expiresAt: new Date(o.expiresAt), createdAt: new Date(o.createdAt) }))
                });
            }
        });

        console.log('Migration completed successfully!');

    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        db.close();
        await prisma.$disconnect();
    }
}

migrateData();
