import { prisma } from "@/lib/prisma";
import CompanyRadars from "@/components/admin/CompanyRadars";
import Link from "next/link";
import { ArrowLeft, Building, Users, Calendar, TrendingUp, TrendingDown, AlertCircle, CheckCircle, Info, MessageCircle } from "lucide-react";
import { computeCommunicationScore } from "@/lib/scoring";

export const dynamic = 'force-dynamic';

export default async function CompanyReportPage({ params }: { params: { domain: string } }) {
    const domain = decodeURIComponent(params.domain);

    // 1. Fetch leads for this domain
    const leads = await prisma.lead.findMany({
        where: {
            email: {
                contains: `@${domain}`
            }
        },
        include: {
            results: {
                orderBy: { createdAt: 'desc' },
                take: 1
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    if (leads.length === 0) {
        return (
            <div className="p-8 text-center text-gray-500">
                <Link href="/admin/companies" className="text-gec-orange hover:underline mb-4 block">
                    &larr; Back to Companies
                </Link>
                <h1 className="text-xl font-bold">No leads found for domain: {domain}</h1>
            </div>
        );
    }

    // 2. Aggregate Data
    const allQuestions = await prisma.question.findMany({ orderBy: { order: 'asc' } });
    // Maturity-only: the radar/median/variance math below assumes a 1-5 scale —
    // 1-7 communication answers must not enter it.
    const questions = allQuestions.filter(q => q.scoringSystem !== 'communication');

    // Data Structures
    // overlayData: [{ subject: 'Q1', fullMark: 5, leadId1: 4, leadId2: 3 ... }]
    // aggregateData: [{ subject: 'Q1', fullMark: 5, average: 3.5, median: 3 }]

    // Calculation Helpers
    const scoresByQuestion: Record<string, number[]> = {};

    // Initialize buckets
    questions.forEach(q => {
        scoresByQuestion[q.id] = [];
    });

    const leadsList: { id: string; name: string; email: string }[] = [];

    // Communication: independent system, aggregated as average-of-per-lead-averages.
    let communicationSum = 0;
    let communicationLeadCount = 0;
    const constructSums: Record<string, { sum: number; count: number }> = {};

    // First Pass: Collect all scores
    leads.forEach(lead => {
        const result = lead.results[0];
        if (result) {
            leadsList.push({
                id: lead.id,
                name: `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Anonymous',
                email: lead.email
            });
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
            } catch (e) {
                // ignore malformed
            }
        }
    });

    const communicationGlobalAverage = communicationLeadCount > 0 ? communicationSum / communicationLeadCount : 0;
    const communicationConstructAverages = Object.fromEntries(
        Object.entries(constructSums).map(([key, { sum, count }]) => [key, count > 0 ? sum / count : 0])
    );

    // Build Datasets
    // Build Datasets
    const overlayData = questions.map((q, index) => {
        const subject = q.shortLabel && q.shortLabel.trim().length > 0 ? q.shortLabel : `Q${index + 1}`;
        const row: any = { subject, fullSubject: q.text, fullMark: 5 };

        // Fill individual lead scores for this question
        leads.forEach(lead => {
            const result = lead.results[0];
            if (result) {
                try {
                    const answers = JSON.parse(result.answers);
                    const val = parseFloat(answers[q.id] || answers[String(q.id)]);
                    if (!isNaN(val)) {
                        row[lead.id] = val; // Add this lead's score to the row
                    }
                } catch (e) { }
            }
        });
        return row;
    });

    const aggregateData = questions.map((q, index) => {
        const subject = q.shortLabel && q.shortLabel.trim().length > 0 ? q.shortLabel : `Q${index + 1}`;
        const scores = scoresByQuestion[q.id];

        let average = 0;
        let median = 0;

        if (scores.length > 0) {
            // Average
            const sum = scores.reduce((a, b) => a + b, 0);
            average = sum / scores.length;

            // Median
            scores.sort((a, b) => a - b);
            const mid = Math.floor(scores.length / 2);
            if (scores.length % 2 !== 0) {
                median = scores[mid];
            } else {
                median = (scores[mid - 1] + scores[mid]) / 2;
            }
        }

        return {
            id: q.id,
            subject,
            fullSubject: q.text,
            fullMark: 5,
            average,
            median
        };
    });

    // Calculate Global Average for the Summary Card
    const totalAvgScore = aggregateData.reduce((acc, curr) => acc + curr.average, 0) / (aggregateData.length || 1);

    // Calculate Variance for each question (needed for insights)
    aggregateData.forEach(q => {
        const scores = scoresByQuestion[q.id]; // Access from closure scope
        if (scores && scores.length > 0) {
            const mean = q.average;
            const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;
            (q as any).variance = variance;
        } else {
            (q as any).variance = 0;
        }
    });

    // Insights Logic
    const sortedByScore = [...aggregateData].sort((a, b) => b.average - a.average);
    const sortedByVariance = [...aggregateData].sort((a, b) => (a as any).variance - (b as any).variance);

    const insights = {
        strongest: sortedByScore[0],
        weakest: sortedByScore[sortedByScore.length - 1],
        consensus: sortedByVariance[0],
        divergence: sortedByVariance[sortedByVariance.length - 1]
    };


    return (
        <div className="space-y-8">
            {/* Header / Nav */}
            <div className="flex items-center gap-4">
                <Link href="/admin/companies" className="flex items-center gap-2 text-gray-500 hover:text-gec-orange transition-colors">
                    <ArrowLeft size={20} />
                    <span>Back to Companies</span>
                </Link>
                <div className="h-6 w-px bg-gray-300"></div>
                <h1 className="text-xl font-bold text-gray-800">Company Report: {domain}</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Stats */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Overview</h2>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Building className="text-gray-400" size={20} />
                                <div>
                                    <div className="text-xs text-gray-400 uppercase font-bold">Domain</div>
                                    <div className="font-bold text-gray-800">{domain}</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <Users className="text-gray-400" size={20} />
                                <div>
                                    <div className="text-xs text-gray-400 uppercase font-bold">Participants</div>
                                    <div className="font-bold text-gray-800">{leads.length} Employees</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <Calendar className="text-gray-400" size={20} />
                                <div>
                                    <div className="text-xs text-gray-400 uppercase font-bold">Latest Activity</div>
                                    <div className="font-bold text-gray-800">{new Date(leads[0].createdAt).toLocaleDateString()}</div>
                                </div>
                            </div>

                            <div className="pt-4 mt-2 border-t">
                                <div className="bg-blue-50 p-4 rounded-lg text-center">
                                    <span className="block text-3xl font-bold text-[#F05324]">{totalAvgScore.toFixed(2)}</span>
                                    <span className="text-xs text-gray-500 uppercase font-bold">Average Maturity Score</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {communicationLeadCount > 0 && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                                <MessageCircle size={18} className="text-[#049978]" /> Communication
                            </h2>
                            <div className="bg-teal-50 p-4 rounded-lg text-center mb-4">
                                <span className="block text-3xl font-bold text-[#049978]">{communicationGlobalAverage.toFixed(2)}</span>
                                <span className="text-xs text-gray-500 uppercase font-bold">Average Communication Score</span>
                            </div>
                            {Object.entries(communicationConstructAverages).length > 0 && (
                                <div className="space-y-2">
                                    {Object.entries(communicationConstructAverages).map(([key, avg]) => (
                                        <div key={key} className="flex items-center justify-between text-sm">
                                            <span className="text-gray-600">{key}</span>
                                            <span className="font-bold text-[#049978]">{(avg as number).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Column: Visualization */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Insights Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InsightCard
                            icon={<TrendingUp size={24} className="text-green-500" />}
                            title="ყველაზე ძლიერი მხარე"
                            value={insights.strongest?.subject}
                            valueTooltip={insights.strongest?.fullSubject}
                            subValue={`საშუალო: ${insights.strongest?.average?.toFixed(2)}`}
                            color="green"
                            tooltip="ის განზომილება, რომელშიც გუნდს ყველაზე მაღალი საშუალო ქულა აქვს."
                        />
                        <InsightCard
                            icon={<TrendingDown size={24} className="text-red-500" />}
                            title="ყველაზე სუსტი მხარე"
                            value={insights.weakest?.subject}
                            valueTooltip={insights.weakest?.fullSubject}
                            subValue={`საშუალო: ${insights.weakest?.average?.toFixed(2)}`}
                            color="red"
                            tooltip="ის განზომილება, რომელშიც გუნდს ყველაზე დაბალი საშუალო ქულა აქვს."
                        />
                        <InsightCard
                            icon={<CheckCircle size={24} className="text-blue-500" />}
                            title="მაღალი თანხვედრა"
                            value={insights.consensus?.subject}
                            valueTooltip={insights.consensus?.fullSubject}
                            subValue="გუნდი თანხმდება"
                            color="blue"
                            tooltip="განზომილება, სადაც პასუხები ყველაზე მეტად ემთხვევა ერთმანეთს (ყველაზე დაბალი ვარიაცია)."
                        />
                        <InsightCard
                            icon={<AlertCircle size={24} className="text-orange-500" />}
                            title="ყველაზე დიდი აცდენა"
                            value={insights.divergence?.subject}
                            valueTooltip={insights.divergence?.fullSubject}
                            subValue="აზრთა სხვადასხვაობა"
                            color="orange"
                            tooltip="განზომილება, სადაც გუნდის წევრებს შორის ყველაზე დიდი აზრთა სხვადასხვაობაა (მაღალი ვარიაცია)."
                        />
                    </div>

                    <CompanyRadars
                        overlayData={overlayData}
                        aggregateData={aggregateData}
                        leads={leadsList}
                    />
                </div>
            </div>
        </div>
    );
}

function InsightCard({ icon, title, value, subValue, color, tooltip, valueTooltip }: any) {
    return (
        <div className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-${color}-500 group relative flex flex-col`}>
            {tooltip && (
                <div className="absolute top-2 right-2 text-gray-300 hover:text-gray-500 cursor-help" title={tooltip}>
                    <AlertCircle size={16} />
                </div>
            )}
            <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg bg-${color}-50`}>
                    {icon}
                </div>
            </div>
            <div className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1" title={tooltip}>{title}</div>
            <div className="flex items-center gap-2 mb-1">
                <div className="text-lg font-bold text-gray-800 leading-tight">{value || 'N/A'}</div>
                {valueTooltip && (
                    <div className="text-gray-400 hover:text-gray-600 cursor-help transition-colors" title={valueTooltip}>
                        <Info size={16} />
                    </div>
                )}
            </div>
            <div className="text-xs text-gray-500">{subValue}</div>
        </div>
    );
}
