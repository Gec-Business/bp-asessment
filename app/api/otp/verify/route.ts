export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const { email, code } = await req.json();

        if (!email || !code) {
            return NextResponse.json({ error: "Email and code are required" }, { status: 400 });
        }

        // 1. Find OTP Record
        const record = await prisma.otpVerification.findUnique({
            where: { email }
        });

        // 2. Validate
        if (!record) {
            return NextResponse.json({ success: false, message: "Invalid code" }, { status: 400 });
        }

        if (record.code !== code) {
            return NextResponse.json({ success: false, message: "Invalid code" }, { status: 400 });
        }

        if (new Date() > record.expiresAt) {
            return NextResponse.json({ success: false, message: "Code expired" }, { status: 400 });
        }

        // 3. Delete Record (Prevent Reuse)
        await prisma.otpVerification.delete({
            where: { email }
        });

        // 4. Find Lead ID (for returning users)
        // We do this AFTER verification to ensure they have the right code.
        const lead = await prisma.lead.findFirst({
            where: { email }
        });

        return NextResponse.json({
            success: true,
            leadId: lead?.id
        });

    } catch (error) {
        console.error("OTP Verify Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
