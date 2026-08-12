
import { NextRequest, NextResponse } from "next/server";
import ReactPDF from "@react-pdf/renderer";
import ReportDocument from "@/components/pdf/ReportDocument";
import { getLocaleFromRequest } from "@/lib/i18n/getLocaleFromRequest";

export async function POST(req: NextRequest) {
    try {
        const locale = getLocaleFromRequest(req);
        const body = await req.json();
        const { score, firstName, companyName, phaseId, phaseConfig, radarData } = body;

        // Generate PDF Stream
        const stream = await ReactPDF.renderToStream(
            <ReportDocument data={body} locale={locale} />
        );

        // Return as stream
        return new NextResponse(stream as any, {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": 'attachment; filename="report.pdf"',
            },
        });

    } catch (error: any) {
        console.error("CRITICAL PDF ERROR:", error);
        console.error("Stack Trace:", error.stack);
        return NextResponse.json(
            { error: "Failed to generate PDF", details: error.message },
            { status: 500 }
        );
    }
}
