
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getLocaleFromRequest } from "@/lib/i18n/getLocaleFromRequest";
import { localizeLandingStep } from "@/lib/i18n/localize";

// Admin (authenticated) requests get raw bilingual rows for editing;
// public requests get localized single-language data.
export async function GET(req: NextRequest) {
    const locale = getLocaleFromRequest(req);
    const isAdmin = !!(await getServerSession(authOptions));
    try {
        const steps = await prisma.landingStep.findMany({
            orderBy: { stepNumber: 'asc' }
        });
        return NextResponse.json(isAdmin ? steps : steps.map((s) => localizeLandingStep(s, locale)));
    } catch (error) {
        console.error("Failed to fetch landing steps:", error);
        return NextResponse.json([], { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const { id, title, titleKa, subtitle, subtitleKa, icon, description, descriptionKa } = body;

        const updated = await prisma.landingStep.update({
            where: { id: parseInt(id) },
            data: {
                title,
                titleKa,
                subtitle,
                subtitleKa,
                icon: icon || "Box",
                description,
                descriptionKa,
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Failed to update landing step:", error);
        return NextResponse.json({ error: "Failed to update landing step" }, { status: 500 });
    }
}
