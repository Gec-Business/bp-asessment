import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeCommunicationScore } from "@/lib/scoring";

const PUBLIC_DOMAINS = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com',
    'mail.ru', 'yandex.ru', 'live.com', 'protonmail.com', 'aol.com', 'zoho.com', 'gmx.com'
];

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get('email');
        const leadId = searchParams.get('leadId');

        let targetDomain = '';

        // 1. Resolve Domain
        // The `email` path must only ever resolve a domain for an email that
        // actually completed the assessment — otherwise anyone could pass an
        // arbitrary company's domain here and pull their aggregate data
        // without ever being a participant.
        if (email) {
            if (email.includes('@')) {
                const requester = await prisma.lead.findFirst({ where: { email } });
                if (requester) targetDomain = email.split('@')[1].toLowerCase();
            }
        } else if (leadId) {
            const lead = await prisma.lead.findUnique({ where: { id: leadId } });
            if (lead && lead.email.includes('@')) {
                targetDomain = lead.email.split('@')[1].toLowerCase();
            }
        }

        if (!targetDomain) {
            return NextResponse.json({ available: false, reason: 'No valid domain' });
        }

        // 2. Blacklist Check
        if (PUBLIC_DOMAINS.includes(targetDomain)) {
            return NextResponse.json({ available: false, reason: 'Public domain' });
        }

        // 3. Fetch Data
        const leads = await prisma.lead.findMany({
            where: {
                email: { contains: `@${targetDomain}` }
            },
            select: {
                results: {
                    select: { score: true, answers: true },
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });

        // 4. Min Participation Check
        if (leads.length < 2) {
            return NextResponse.json({ available: false, reason: 'Insufficient participation' });
        }

        // 5. Aggregate Data
        const allQuestions = await prisma.question.findMany({
            select: { id: true, text: true, shortLabel: true, questionType: true, scoringSystem: true, isReverseScored: true, construct: true },
            orderBy: { order: 'asc' }
        });
        // Maturity-only: the per-question radar/variance math below is on a
        // hardcoded 1-5 scale — 1-7 communication answers must not enter it.
        const questions = allQuestions.filter(q => q.scoringSystem !== 'communication');
        const scoresByQuestion: Record<string, number[]> = {};

        // Initialize buckets
        questions.forEach(q => scoresByQuestion[q.id] = []);

        let totalScoreSum = 0;
        let totalScoreCount = 0;

        // Communication: independent system, aggregated as average-of-per-lead-averages
        // (same convention as globalAverage below — each lead weighted equally).
        let communicationSum = 0;
        let communicationLeadCount = 0;
        const constructSums: Record<string, { sum: number; count: number }> = {};

        // Collect scores ONLY (Anonymous)
        leads.forEach(lead => {
            const result = lead.results[0];
            if (result) {
                totalScoreSum += result.score;
                totalScoreCount++;
                try {
                    const answers = JSON.parse(result.answers);
                    Object.keys(answers).forEach(qId => {
                        const val = parseFloat(answers[qId]);
                        if (!isNaN(val) && scoresByQuestion[qId]) {
                            scoresByQuestion[qId].push(val);
                        }
                    });

                    const communication = computeCommunicationScore(allQuestions as any, answers);
                    if (communication.count > 0) {
                        communicationSum += communication.overallAverage;
                        communicationLeadCount++;
                        Object.entries(communication.byConstruct).forEach(([key, bucket]) => {
                            if (!constructSums[key]) constructSums[key] = { sum: 0, count: 0 };
                            constructSums[key].sum += bucket.average;
                            constructSums[key].count++;
                        });
                    }
                } catch (e) { }
            }
        });

        // Metrics
        const globalAverage = totalScoreCount > 0 ? totalScoreSum / totalScoreCount : 0;
        const participantCount = leads.length;
        const communicationGlobalAverage = communicationLeadCount > 0 ? communicationSum / communicationLeadCount : 0;
        const communicationConstructAverages = Object.fromEntries(
            Object.entries(constructSums).map(([key, { sum, count }]) => [key, count > 0 ? sum / count : 0])
        );

        // Build Datasets
        const overlayData = questions.map((q, index) => {
            const subject = q.shortLabel || `Q${index + 1}`;
            const row: any = { subject, fullSubject: q.text, fullMark: 5 };
            // Anonymous Overlay: Use index as key instead of lead ID
            scoresByQuestion[q.id].forEach((val, idx) => {
                row[`anon_${idx}`] = val;
            });
            return row;
        });

        const aggregateData = questions.map((q, index) => {
            const subject = q.shortLabel || `Q${index + 1}`;
            const scores = scoresByQuestion[q.id];

            let average = 0;
            let median = 0;
            let variance = 0;

            if (scores.length > 0) {
                // Average
                const sum = scores.reduce((a, b) => a + b, 0);
                average = sum / scores.length;

                // Median
                const sorted = [...scores].sort((a, b) => a - b);
                const mid = Math.floor(sorted.length / 2);
                median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

                // Variance
                const mean = average;
                variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;
            }

            return {
                subject,
                fullSubject: q.text,
                fullMark: 5,
                average,
                median,
                variance
            };
        });

        // Insights
        const sortedByScore = [...aggregateData].sort((a, b) => b.average - a.average);
        const sortedByVariance = [...aggregateData].sort((a, b) => a.variance - b.variance);

        const insights = {
            strongest: sortedByScore[0],
            weakest: sortedByScore[sortedByScore.length - 1],
            consensus: sortedByVariance[0], // Lowest variance
            divergence: sortedByVariance[sortedByVariance.length - 1] // Highest variance
        };

        return NextResponse.json({
            available: true,
            domain: targetDomain,
            metrics: {
                globalAverage,
                participantCount,
                communicationGlobalAverage,
                communicationParticipantCount: communicationLeadCount
            },
            overlayData,
            aggregateData,
            insights,
            communicationConstructAverages
        });

    } catch (error) {
        console.error("Company Report API Error:", error);
        return NextResponse.json({ available: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
