import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import MaturityRadar from "@/components/MaturityRadar";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, Building, Users, Calendar, MessageCircle } from "lucide-react";
import { computeCommunicationScore } from "@/lib/scoring";

export const dynamic = 'force-dynamic';

export default async function LeadReportPage({ params }: { params: { id: string } }) {
    const lead = await prisma.lead.findUnique({
        where: { id: params.id },
        include: {
            results: {
                orderBy: { createdAt: 'desc' },
                take: 1
            }
        }
    });

    if (!lead) {
        return notFound();
    }

    const result = lead.results[0];
    const questions = await prisma.question.findMany({ orderBy: { order: 'asc' } });
    const phases = await prisma.phase.findMany();

    // Process Radar Data — maturity-only, since this radar's axis is fixed to
    // 0-5 and 1-7 communication answers would distort it.
    const maturityQuestions = questions.filter(q => q.scoringSystem !== 'communication');
    let radarData: Array<{ subject: string; A: number; fullMark: number;[key: string]: any }> = [];
    let phaseConfig = null;
    let communication: ReturnType<typeof computeCommunicationScore> | null = null;

    if (result) {
        try {
            const answersMap = JSON.parse(result.answers);
            radarData = maturityQuestions.map((q, index) => {
                const rawScore = answersMap[q.id] || answersMap[String(q.id)];
                let scoreVal = rawScore !== undefined && rawScore !== null ? parseFloat(String(rawScore)) : 1;
                return {
                    subject: q.shortLabel && q.shortLabel.trim().length > 0 ? q.shortLabel : `Q${index + 1}`,
                    A: scoreVal,
                    fullMark: 5
                };
            });

            communication = computeCommunicationScore(questions as any, answersMap);
            phaseConfig = phases.find(p => p.id === result.phase);
        } catch (e) {
            console.error("Error parsing result data", e);
        }
    }

    return (
        <div className="space-y-8">
            {/* Header / Nav */}
            <div className="flex items-center gap-4">
                <Link href="/admin/leads" className="flex items-center gap-2 text-gray-500 hover:text-gec-orange transition-colors">
                    <ArrowLeft size={20} />
                    <span>Back to Leads</span>
                </Link>
                <div className="h-6 w-px bg-gray-300"></div>
                <h1 className="text-xl font-bold text-gray-800">Lead Report</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Lead Info */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Contact Information</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-400 uppercase font-bold">Full Name</label>
                                <p className="text-lg font-medium text-gray-900">{lead.firstName} {lead.lastName}</p>
                            </div>

                            <div className="flex items-start gap-3">
                                <Mail className="text-gec-orange mt-1" size={18} />
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-bold">Email</label>
                                    <p className="text-gray-700">{lead.email}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Phone className="text-gec-orange mt-1" size={18} />
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-bold">Phone</label>
                                    <p className="text-gray-700">{lead.phone || "N/A"}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Building className="text-gec-orange mt-1" size={18} />
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-bold">Company</label>
                                    <p className="text-gray-700">{lead.company || "N/A"}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Users className="text-gec-orange mt-1" size={18} />
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-bold">Employees</label>
                                    <p className="text-gray-700">{lead.employees || "N/A"}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Calendar className="text-gec-orange mt-1" size={18} />
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-bold">Submitted Date</label>
                                    <p className="text-gray-700">{new Date(lead.createdAt).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {result && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Assessment Summary</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-orange-50 p-4 rounded-lg text-center">
                                    <span className="block text-2xl font-bold text-[#F05324]">{result.score.toFixed(2)}</span>
                                    <span className="text-xs text-gray-500 uppercase font-bold">Score</span>
                                </div>
                                <div className="bg-blue-50 p-4 rounded-lg text-center">
                                    <span className="block text-2xl font-bold text-[#153749]">{result.phase}</span>
                                    <span className="text-xs text-gray-500 uppercase font-bold">Phase</span>
                                </div>
                            </div>
                            {phaseConfig && (
                                <div className="mt-4">
                                    <h3 className="font-bold text-[#153749]">{phaseConfig.title}</h3>
                                    <p className="text-sm text-gray-600 mt-1">{phaseConfig.subtitle}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {communication && communication.count > 0 && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                                <MessageCircle size={18} className="text-[#049978]" /> Communication
                            </h2>
                            <div className="bg-teal-50 p-4 rounded-lg text-center mb-4">
                                <span className="block text-2xl font-bold text-[#049978]">{communication.overallAverage.toFixed(2)} / 7.0</span>
                                <span className="text-xs text-gray-500 uppercase font-bold">Average Score</span>
                            </div>
                            {Object.entries(communication.byConstruct).length > 0 && (
                                <div className="space-y-2">
                                    {Object.entries(communication.byConstruct).map(([key, bucket]) => (
                                        <div key={key} className="flex items-center justify-between text-sm">
                                            <span className="text-gray-600">{key}</span>
                                            <span className="font-bold text-[#049978]">{bucket.average.toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Column: Visualization */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full min-h-[500px]">
                        <h2 className="text-lg font-bold text-gray-800 mb-6 border-b pb-2">Strategic Maturity Radar</h2>

                        {radarData.length > 0 ? (
                            <div className="w-full h-[500px]">
                                <MaturityRadar data={radarData} axisColor="#4B5563" />
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-64 text-gray-400">
                                No assessment data available for chart.
                            </div>
                        )}

                        <div className="md:col-span-2 bg-gray-50 p-6 rounded-lg">
                            <h4 className="font-bold text-gray-700 mb-4 text-sm uppercase tracking-wide">Detailed Answers</h4>
                            <div className="overflow-hidden rounded-lg border border-gray-200">
                                <table className="min-w-full divide-y divide-gray-200 bg-white">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Question</th>
                                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase w-20">System</th>
                                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase w-28">Score</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {questions.map((q) => {
                                            const answersMap = result ? JSON.parse(result.answers) : {};
                                            const rawScore = answersMap[q.id] || answersMap[String(q.id)];
                                            const isCommunication = q.scoringSystem === 'communication';
                                            const scale = isCommunication ? 7 : 5;
                                            const hasAnswer = rawScore !== undefined && rawScore !== null && rawScore !== "";
                                            const effective = hasAnswer && isCommunication && q.isReverseScored
                                                ? 8 - parseFloat(String(rawScore))
                                                : (hasAnswer ? parseFloat(String(rawScore)) : null);
                                            return (
                                                <tr key={q.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3 text-sm text-gray-700">{q.text}</td>
                                                    <td className="px-4 py-3 text-center text-xs text-gray-500">
                                                        {isCommunication ? "Communication" : "Maturity"}
                                                    </td>
                                                    <td className="px-4 py-3 text-center text-sm font-bold text-[#F05324]">
                                                        {hasAnswer ? (
                                                            <>
                                                                {rawScore} / {scale}
                                                                {isCommunication && q.isReverseScored && (
                                                                    <span className="block text-[10px] font-normal text-gray-400">
                                                                        reverse-scored → {effective}
                                                                    </span>
                                                                )}
                                                            </>
                                                        ) : "-"}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
