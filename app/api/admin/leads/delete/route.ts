export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { ids } = await req.json();

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: "No lead IDs provided" }, { status: 400 });
        }

        // Delete the leads. Cascade delete should handle Results, but let's confirm schema if necessary.
        // Prisma schema should have ON DELETE CASCADE if we want it automatic, 
        // or we rely on Prisma runtime cascade if defined in schema.
        // Looking at schema: Result -> Lead is defined as @relation(fields: [leadId], references: [id])
        // It doesn't explicitly say onDelete: Cascade. So Prisma might throw error if we don't delete results first.
        // However, Prisma client usually handles this if relation is set up correctly in schema, or we do a transaction.
        // Safest is to delete related Results first.

        await prisma.$transaction([
            prisma.result.deleteMany({
                where: {
                    leadId: { in: ids }
                }
            }),
            prisma.lead.deleteMany({
                where: {
                    id: { in: ids }
                }
            })
        ]);

        return NextResponse.json({ success: true, count: ids.length });
    } catch (error) {
        console.error("Failed to delete leads:", error);
        return NextResponse.json({ error: "Failed to delete leads" }, { status: 500 });
    }
}
