export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeCommunicationScore } from "@/lib/scoring";

export async function POST(req: NextRequest) {
    try {
        const { email, name, firstName, lastName, companyName, phone, employees, score, phaseId, answers, isNewLead, bypassOtp } = await req.json();

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        // 0. Fetch existing lead to either block (if new) or use data
        const existingLead = await prisma.lead.findFirst({
            where: { email },
            include: { results: { orderBy: { createdAt: 'desc' } } }
        });

        // 0.1 Check Duplicate (Prevent Re-registration of existing leads)
        if (isNewLead && existingLead) {
            return NextResponse.json({
                error: "EmailExists",
                message: "This email has already taken the assessment."
            }, { status: 409 });
        }

        // 0.2 Check Non-existent (Prevent OTP send for non-existent reports)
        if (!isNewLead && !existingLead) {
            return NextResponse.json({
                error: "NotFound",
                message: "ამ იმეილით კითხვარი ჯერ არ შევსებულა."
            }, { status: 404 });
        }

        // 0.5 Bypass Logic (Returning Users)
        if (bypassOtp) {
            if (existingLead) {
                return NextResponse.json({ success: true, leadId: existingLead.id });
            } else {
                return NextResponse.json({ error: "NotFound", message: "Report not found" }, { status: 404 });
            }
        }

        // 1. Generate 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // 2. Set Expiration (10 minutes)
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // 3. Upsert to DB
        await prisma.otpVerification.upsert({
            where: { email },
            update: { code, expiresAt },
            create: { email, code, expiresAt }
        });

        // 4. Send Webhook to Power Automate
        const webhookUrl = process.env.POWER_AUTOMATE_WEBHOOK_URL;

        if (webhookUrl) {
            try {
                // Determine names to send
                let finalFirstName = existingLead?.firstName || firstName || name || "Unknown";
                let finalLastName = existingLead?.lastName || lastName || "Unknown";
                
                // Communication is a separate, additive scoring system — recomputed
                // here from whichever answers are available (persisted result for a
                // returning lead, or the just-collected answers for a brand-new one).
                let communicationScore: number | null = null;
                let communicationConstructScores: Record<string, number> = {};
                try {
                    const rawAnswers = existingLead?.results?.[0]?.answers
                        ? JSON.parse(existingLead.results[0].answers)
                        : (answers || {});
                    const questions = await prisma.question.findMany();
                    const communication = computeCommunicationScore(questions as any, rawAnswers);
                    if (communication.count > 0) {
                        communicationScore = communication.overallAverage;
                        communicationConstructScores = Object.fromEntries(
                            Object.entries(communication.byConstruct).map(([k, v]) => [k, v.average])
                        );
                    }
                } catch (e) {
                    console.error("Communication score computation error:", e);
                }

                const webhookPayload = {
                    action: "send_otp",
                    email,
                    code,
                    name: finalFirstName,
                    firstName: finalFirstName,
                    lastName: finalLastName,
                    company: existingLead?.company || companyName || "Unknown",
                    phone: existingLead?.phone || phone || "",
                    employees: existingLead?.employees || employees || "",
                    score: existingLead?.results?.[0]?.score || (score ? parseFloat(score) : 0),
                    phase: (existingLead?.results?.[0]?.phase || phaseId || 0).toString(),
                    communicationScore,
                    communicationConstructScores
                };

                await fetch(webhookUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(webhookPayload)
                });
            } catch (webhookError) {
                console.error("Failed to trigger Power Automate Webhook:", webhookError);
                // Continue even if webhook fails? No, usually we need the email sent. 
                // But for now we assume it works or we proceed. 
                // If webhook fails, user won't get code. 
                // We should probably log it but return success to UI so they can retry?
            }
        } else {
            console.warn("POWER_AUTOMATE_WEBHOOK_URL is not defined");
            // ensure we don't block development if env is missing, but maybe log it.
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("OTP Send Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
