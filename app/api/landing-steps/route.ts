
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
