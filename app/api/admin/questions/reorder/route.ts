export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// POST: Persist a new question order.
// Body: { ids: number[] } — full list of question ids in the desired order.
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { ids } = await req.json();
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: "ids array required" }, { status: 400 });
        }

        await prisma.$transaction(
            ids.map((id: number, index: number) =>
                prisma.question.update({
                    where: { id: parseInt(String(id)) },
                    data: { order: index + 1 }
                })
            )
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Reorder Questions Error:", error);
        return NextResponse.json({ error: "Failed to reorder questions" }, { status: 500 });
    }
}
