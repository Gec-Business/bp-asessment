
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const steps = await prisma.landingStep.findMany({
            orderBy: { stepNumber: 'asc' }
        });
        return NextResponse.json(steps.length > 0 ? steps : []);
    } catch (error) {
        console.error("Failed to fetch landing steps:", error);
        return NextResponse.json([], { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, title, subtitle, icon, description } = body;

        const updated = await prisma.landingStep.update({
            where: { id: parseInt(id) },
            data: {
                title,
                subtitle,
                icon: icon || "Box",
                description,
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Failed to update landing step:", error);
        return NextResponse.json({ error: "Failed to update landing step" }, { status: 500 });
    }
}
