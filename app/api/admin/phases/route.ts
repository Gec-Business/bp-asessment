export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getLocaleFromRequest } from "@/lib/i18n/getLocaleFromRequest";
import { localizePhase } from "@/lib/i18n/localize";

// GET: Fetch all phases (ordered by ID). Admin (authenticated) requests get
// raw bilingual rows for editing; public requests get localized data.
export async function GET(req: NextRequest) {
    const locale = getLocaleFromRequest(req);
    const isAdmin = !!(await getServerSession(authOptions));
    try {
        const phases = await prisma.phase.findMany({
            orderBy: { id: 'asc' }
        });
        return NextResponse.json(isAdmin ? phases : phases.map((p) => localizePhase(p, locale)));
    } catch (error) {
        console.error("Failed to fetch phases:", error);
        return NextResponse.json({ error: "Failed to fetch phases" }, { status: 500 });
    }
}

// PUT: Update a specific phase (Admin Only)
export async function PUT(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const {
            id, title, subtitle, color, icon, essence, focus, meaningPoints, manifestation, challenges, benefits, recommendations,
            titleKa, subtitleKa, essenceKa, focusKa, meaningPointsKa, manifestationKa, challengesKa, benefitsKa, recommendationsKa,
        } = body;

        const sharedData = {
            title, subtitle, color, icon, essence, focus,
            meaningPoints, manifestation, challenges, benefits, recommendations,
            titleKa, subtitleKa, essenceKa, focusKa, meaningPointsKa, manifestationKa, challengesKa, benefitsKa, recommendationsKa,
        };

        const updated = await prisma.phase.upsert({
            where: { id: parseInt(id) },
            update: sharedData,
            create: { id: parseInt(id), ...sharedData },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Phase Update Error:", error);
        return NextResponse.json({ error: "Failed to update phase" }, { status: 500 });
    }
}
