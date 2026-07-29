
import { NextRequest, NextResponse } from "next/server";
import ReactPDF from "@react-pdf/renderer";
import ReportDocument from "@/components/pdf/ReportDocument";

// Important: Next.js API Routes run in a Node.js-compatible environment
// @react-pdf/renderer works best on the server.

// Register Font (Ensure this path is correct and font exists)
// Using a standard font or a Google Font URL is safer for Vercel/Production
// But React-PDF requires registering fonts.
// If using local font, use path.resolve(process.cwd(), "public/fonts/...")
import path from "path";

// Register Font (Ensure this path is correct and font exists)

import fs from "fs";

try {
    const fontRegular = path.resolve(process.cwd(), "public/fonts/BPG_Glaho.ttf");
    const fontCaps = path.resolve(process.cwd(), "public/fonts/BPG_Glaho_Caps.ttf");

    if (fs.existsSync(fontRegular)) {
        ReactPDF.Font.register({
            family: "BPG Glaho",
            src: fontRegular
        });
    } else {
        console.warn("BPG Glaho font missing, skipping registration.");
    }

    if (fs.existsSync(fontCaps)) {
        ReactPDF.Font.register({
            family: "BPG Glaho Caps",
            src: fontCaps
        });
    } else {
        console.warn("BPG Glaho Caps font missing, skipping registration.");
    }
} catch (e) {
    console.error("Font registration CRITICAL FAILURE", e);
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { score, firstName, companyName, phaseId, phaseConfig, radarData } = body;

        // Generate PDF Stream
        const stream = await ReactPDF.renderToStream(
            <ReportDocument data={body} />
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
