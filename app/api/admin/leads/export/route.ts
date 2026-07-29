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

        // 1. Fetch Selected Leads with Answers
        const leads = await prisma.lead.findMany({
            where: { id: { in: ids } },
            include: {
                results: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // 2. Fetch All Questions to build columns
        const questions = await prisma.question.findMany({
            orderBy: { order: 'asc' }
        });

        // 3. Build CSV Header
        // BOM for UTF-8 Excel compatibility
        let csv = '\ufeff';

        const headers = [
            "Date",
            "First Name",
            "Last Name",
            "Company",
            "Employees",
            "Email",
            "Phone",
            "Total Score",
            "Phase",
            ...questions.map(q => `"${q.shortLabel || q.text.replace(/"/g, '""')}"`) // Use Short Label if available, else text. Escape quotes.
        ];

        csv += headers.join(",") + "\n";

        // 4. Build CSV Rows
        for (const lead of leads) {
            const result = lead.results[0];
            let answers: Record<string, any> = {};

            if (result && result.answers) {
                try {
                    answers = JSON.parse(result.answers);
                } catch (e) {
                    console.error("Error parsing answers for lead", lead.id, e);
                }
            }

            const row = [
                `"${new Date(lead.createdAt).toLocaleDateString("en-GB")}"`,
                `"${lead.firstName.replace(/"/g, '""')}"`,
                `"${lead.lastName.replace(/"/g, '""')}"`,
                `"${(lead.company || "").replace(/"/g, '""')}"`,
                `"${(lead.employees || "").replace(/"/g, '""')}"`,
                `"${lead.email.replace(/"/g, '""')}"`,
                `"${(lead.phone || "").replace(/"/g, '""')}"`,
                result ? result.score.toFixed(2) : "0.00",
                result ? result.phase : "0",
                ...questions.map(q => {
                    const score = answers[q.id.toString()] || "";
                    return score;
                })
            ];

            csv += row.join(",") + "\n";
        }

        // 5. Return CSV Response
        return new NextResponse(csv, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="leads_export_${new Date().toISOString().split('T')[0]}.csv"`
            }
        });

    } catch (error) {
        console.error("Failed to export leads:", error);
        return NextResponse.json({ error: "Failed to export leads" }, { status: 500 });
    }
}
