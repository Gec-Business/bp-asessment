export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const leadId = searchParams.get('leadId');

        if (!leadId) {
            return NextResponse.json({ error: "Missing leadId" }, { status: 400 });
        }

        const lead = await prisma.lead.findUnique({
            where: { id: leadId },
            include: {
                results: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });

        if (!lead || lead.results.length === 0) {
            return NextResponse.json({ error: "Result not found" }, { status: 404 });
        }

        return NextResponse.json({
            firstName: lead.firstName,
            companyName: lead.company,
            email: lead.email,
            score: lead.results[0].score,
            answers: lead.results[0].answers,
            phase: lead.results[0].phase
        });
    } catch (error) {
        console.error("Result Fetch Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
