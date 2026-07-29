export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET: Fetch all phases (ordered by ID)
export async function GET() {
    try {
        const phases = await prisma.phase.findMany({
            orderBy: { id: 'asc' }
        });
        return NextResponse.json(phases);
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
        const { id, title, subtitle, color, icon, essence, focus, meaningPoints, manifestation, challenges, benefits, recommendations } = body;

        const updated = await prisma.phase.upsert({
            where: { id: parseInt(id) },
            update: {
                title,
                subtitle,
                color,
                icon,
                essence,
                focus,
                meaningPoints, // JSON string
                manifestation, // JSON string
                challenges,    // JSON string
                benefits,      // JSON string
                recommendations
            },
            create: {
                id: parseInt(id),
                title,
                subtitle,
                color,
                icon,
                essence,
                focus,
                meaningPoints,
                manifestation,
                challenges,
                benefits,
                recommendations
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Phase Update Error:", error);
        return NextResponse.json({ error: "Failed to update phase" }, { status: 500 });
    }
}
