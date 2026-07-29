export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET: Fetch all leads with their latest result
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const leads = await prisma.lead.findMany({
            include: {
                results: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(leads);
    } catch (error) {
        console.error("Failed to fetch leads:", error);
        return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 });
    }
}

// POST: Create a new lead (Called from LeadForm)
// Ideally this should be in /api/assessment/submit or similar, but can be here too.
// The existing /api/assessment/submit handles this, so this might be redundant for creation.
// But we might want it for admin creation if needed.
