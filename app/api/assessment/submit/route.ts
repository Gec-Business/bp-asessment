export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeCommunicationScore } from "@/lib/scoring";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { firstName, lastName, email, phone, company, companyName, employees, score, phaseId, answers, marketingConsent } = body;

    // Check if lead exists (since email is not unique in Schema, prisma won't throw P2002)
    const existingLead = await prisma.lead.findFirst({
      where: { email }
    });

    if (existingLead) {
      return NextResponse.json({
        error: "EmailExists",
        message: "This email has already taken the assessment."
      }, { status: 409 });
    }

    // Create Lead and Result in transaction
    const result = await prisma.lead.create({
      data: {
        firstName,
        lastName,
        email,
        phone: phone || "",
        company: companyName || company || "", // Fix: Usage of companyName from frontend
        employees: employees || "",
        marketingConsent: marketingConsent !== undefined ? marketingConsent : true,
        results: {
          create: {
            score: typeof score === 'string' ? parseFloat(score) : score,
            phase: phaseId,
            answers: JSON.stringify(answers || {}),
          }
        }
      },
      include: { results: true }
    });

    // Communication is a separate, additive scoring system — recomputed
    // server-side here from the same answers, never blended into `score`/`phase` above.
    let communicationScore: number | null = null;
    let communicationConstructScores: Record<string, number> = {};
    try {
      const questions = await prisma.question.findMany();
      const communication = computeCommunicationScore(questions as any, answers || {});
      if (communication.count > 0) {
        communicationScore = communication.overallAverage;
        communicationConstructScores = Object.fromEntries(
          Object.entries(communication.byConstruct).map(([k, v]) => [k, v.average])
        );
      }
    } catch (e) {
      console.error("Communication score computation error:", e);
    }

    // Await webhook call to Power Automate for "create_task" in serverless environment
    if (process.env.POWER_AUTOMATE_WEBHOOK_URL) {
      try {
        console.log("🚀 PREPARING TO SEND CREATE_TASK WEBHOOK...");

        // Safely fallback all variables to prevent undefined crashes and cast to strings for Power Automate schema
        const webhookPayload = {
          action: "create_task",
          firstName: firstName?.split(' ')[0] || "Unknown",
          lastName: lastName || firstName?.split(' ').slice(1).join(' ') || "",
          email: email || "",
          phone: phone || "",
          company: companyName || company || "Unknown",
          employees: employees || "",
          score: typeof score === 'string' ? parseFloat(score) : (score || 0),
          phase: (phaseId || 0).toString(),
          marketingConsent: marketingConsent ? "დიახ" : "არა",
          communicationScore,
          communicationConstructScores
        };
        console.log("📦 PAYLOAD READY:", JSON.stringify(webhookPayload));

        const webhookRes = await fetch(process.env.POWER_AUTOMATE_WEBHOOK_URL as string, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookPayload)
        });

        if (!webhookRes.ok) {
          console.error("❌ WEBHOOK FAILED AT POWER AUTOMATE:", webhookRes.status, await webhookRes.text());
        } else {
          console.log("✅ WEBHOOK SUCCESSFULLY DELIVERED TO POWER AUTOMATE!");
        }

      } catch (webhookErr) {
        console.error("🚨 CRITICAL BACKEND ERROR DURING WEBHOOK PREP/SEND:", webhookErr);
      }
    }

    // ONLY AFTER the awaited try/catch, return the response to the user
    return NextResponse.json({ success: true, id: result.id });
  } catch (error: any) {
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      return NextResponse.json({
        error: "EmailExists",
        message: "This email has already taken the assessment."
      }, { status: 409 });
    }
    console.error("Submission error:", error);
    return NextResponse.json({ error: "Failed to submit assessment" }, { status: 500 });
  }
}

export async function GET() {
  // Admin only - fetch all leads
  try {
    const leads = await prisma.lead.findMany({
      include: { results: { orderBy: { createdAt: 'desc' } } },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(leads);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 });
  }
}
