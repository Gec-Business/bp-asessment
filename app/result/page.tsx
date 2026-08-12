"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import ReportView from "@/components/ReportView";
import MaturityRadar from "@/components/MaturityRadar";
import CompanyReportView from "@/components/assessment/CompanyReportView";
import CommunicationReportView from "@/components/assessment/CommunicationReportView";
import { computeCommunicationScore } from "@/lib/scoring";
import { useDictionary } from "@/lib/i18n/LocaleProvider";

const getPhaseId = (score: number) => {
    if (score < 2) return 1;
    if (score < 3) return 2;
    if (score < 4) return 3;
    if (score < 5) return 4;
    return 5;
};

export default function ResultPage() {
    const router = useRouter();
    const dict = useDictionary().result;
    const [score, setScore] = useState<number | null>(null);
    const [userName, setUserName] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [loading, setLoading] = useState(false);
    const [phaseConfig, setPhaseConfig] = useState<any>(null);
    const [radarData, setRadarData] = useState<any[]>([]);

    const [companyReport, setCompanyReport] = useState<any>(null); // Should match ReportData type ideally
    const [viewMode, setViewMode] = useState<'individual' | 'company'>('individual');
    const [settings, setSettings] = useState<any>(null);
    const [communication, setCommunication] = useState<any>(null);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const leadId = urlParams.get('leadId');

        const isPreview = urlParams.get('preview') === 'true';

        const s = localStorage.getItem("assessmentScore");
        const name = localStorage.getItem("userName");
        const storedEmail = localStorage.getItem("assessmentEmail");
        const company = localStorage.getItem("companyName");

        if (!s && !leadId && !isPreview) { router.replace("/"); return; }

        let userResultPromise = leadId 
            ? fetch(`/api/assessment/result?leadId=${leadId}`).then(res => res.ok ? res.json() : null).catch(() => null)
            : Promise.resolve(null);

        // Fetch all data in parallel
        Promise.all([
            fetch('/api/admin/phases', { cache: 'no-store' }).then(res => res.json()),
            fetch('/api/admin/questions', { cache: 'no-store' }).then(res => res.json()),
            fetch('/api/admin/settings', { cache: 'no-store' }).then(res => res.json()),
            userResultPromise
        ]).then(([phasesData, questionsData, settingsData, userResultData]) => {
            if (settingsData) setSettings(settingsData);
            
            let finalScore = s ? parseFloat(s) : null;
            let finalName = name || dict.guestName;
            let finalCompany = company || "Company";
            let finalAnswersStr = localStorage.getItem("assessmentAnswers");
            let finalEmail = storedEmail;

            if (userResultData && !userResultData.error) {
                finalScore = userResultData.score;
                finalName = userResultData.firstName || dict.guestName;
                finalCompany = userResultData.companyName || "Company";
                finalAnswersStr = typeof userResultData.answers === 'string' ? userResultData.answers : JSON.stringify(userResultData.answers);
                finalEmail = userResultData.email;
            }

            if (finalScore === null) {
                router.replace("/");
                return;
            }

            setScore(finalScore);
            setUserName(finalName);
            setCompanyName(finalCompany);

            const phaseIdValue = getPhaseId(finalScore);

            // 1. Process Radar Data first so we can use it for mock company report
            // Maturity-only: filter out communication (1-7 scale) questions so they
            // don't get plotted against the hardcoded 1-5 radar axis below.
            const maturityQuestions = questionsData.filter((q: any) => q.scoringSystem !== 'communication');

            let chartData: any[] = [];
            try {
                if (finalAnswersStr) {
                    const answersMap = typeof finalAnswersStr === 'string' ? JSON.parse(finalAnswersStr) : finalAnswersStr;

                    chartData = maturityQuestions.map((q: any, index: number) => {
                        const rawScore = answersMap[q.id] || answersMap[String(q.id)];
                        let scoreVal = 1;
                        if (rawScore !== undefined && rawScore !== null) {
                            scoreVal = parseFloat(String(rawScore));
                        }

                        return {
                            subject: q.shortLabel && q.shortLabel.trim().length > 0 ? q.shortLabel : `Q${index + 1}`,
                            fullSubject: q.text,
                            A: scoreVal,
                            fullMark: 5
                        };
                    });

                    const communicationResult = computeCommunicationScore(questionsData, answersMap);
                    setCommunication(communicationResult);

                    // Communication is on a 1-7 scale; this radar's axis is fixed to
                    // 0-5 (matrix questions). Normalize proportionally so the point
                    // sits sensibly on the same rings — it's still a different
                    // metric, just made visually comparable here. Placed first so
                    // it renders at the top of the chart.
                    if (communicationResult.count > 0) {
                        chartData = [
                            {
                                subject: dict.communicationLabel,
                                fullSubject: dict.communicationChartFullSubject(communicationResult.overallAverage.toFixed(2)),
                                A: (communicationResult.overallAverage / 7) * 5,
                                fullMark: 5
                            },
                            ...chartData
                        ];
                    }

                    setRadarData(chartData);
                }
            } catch (e) {
                console.error("Radar Error", e);
            }

            // 2. Fetch or mock company report
            if (isPreview) {
                setCompanyReport({
                    available: true,
                    domain: finalCompany || dict.previewCompanyName,
                    metrics: {
                        globalAverage: finalScore || 3.5,
                        participantCount: 5
                    },
                    overlayData: chartData.map(r => ({
                        subject: r.subject,
                        fullSubject: r.fullSubject,
                        anon_1: Math.max(1, Math.min(5, r.A + (Math.random() * 1 - 0.5))),
                        anon_2: Math.max(1, Math.min(5, r.A + (Math.random() * 1.5 - 0.75))),
                        anon_3: Math.max(1, Math.min(5, r.A + (Math.random() * 2 - 1))),
                        anon_4: Math.max(1, Math.min(5, r.A + (Math.random() * 0.5 - 0.25))),
                        anon_5: Math.max(1, Math.min(5, r.A + (Math.random() * 1.2 - 0.6))),
                    })),
                    aggregateData: chartData.map(r => ({
                        subject: r.subject,
                        fullSubject: r.fullSubject,
                        average: r.A,
                        median: Math.max(1, Math.min(5, r.A + 0.1))
                    })),
                    insights: {
                        strongest: { 
                            subject: chartData[0]?.subject || "N/A", 
                            fullSubject: chartData[0]?.fullSubject,
                            average: Math.min(5, (finalScore || 3.5) + 0.5) 
                        },
                        weakest: { 
                            subject: chartData[1]?.subject || "N/A", 
                            fullSubject: chartData[1]?.fullSubject,
                            average: Math.max(1, (finalScore || 3.5) - 0.5) 
                        },
                        consensus: { 
                            subject: chartData[2]?.subject || "N/A", 
                            fullSubject: chartData[2]?.fullSubject,
                            variance: 0.1 
                        },
                        divergence: { 
                            subject: chartData[3]?.subject || "N/A", 
                            fullSubject: chartData[3]?.fullSubject,
                            variance: 1.2 
                        }
                    }
                });
            } else if (finalEmail) {
                fetch(`/api/assessment/company-report?email=${finalEmail}`, { cache: 'no-store' })
                    .then(res => res.json())
                    .then(reportData => {
                        if (reportData && reportData.available) {
                            setCompanyReport(reportData);
                        }
                    })
                    .catch(err => console.error("Company report error", err));
            }

            // 1. Process Phase Config
            const config = phasesData.find((p: any) => p.id === phaseIdValue);
            if (config) {
                const parseArray = (val: any) => {
                    try { return typeof val === 'string' ? JSON.parse(val) : val; } catch { return []; }
                };
                const parseObj = (val: any) => {
                    try { return typeof val === 'string' ? JSON.parse(val) : val; } catch { return {}; }
                };

                setPhaseConfig({
                    ...config,
                    essence: config.essence || "",
                    focus: config.focus || "",
                    icon: config.icon || "Box",
                    meaningPoints: parseArray(config.meaningPoints),
                    manifestation: parseObj(config.manifestation),
                    challenges: parseArray(config.challenges),
                    benefits: parseArray(config.benefits),
                    recommendations: config.recommendations || ""
                });
            }


        });
    }, [router]);

    const handleDownloadPDF = async () => {
        setLoading(true);
        try {
            const companyName = localStorage.getItem("companyName");
            const response = await fetch("/api/generate-pdf", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    score,
                    firstName: userName,
                    companyName,
                    phaseId: phaseConfig.id,
                    phaseConfig,
                    radarData,
                    communication
                }),
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `GEC_Strategy_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
            } else {
                alert(dict.pdfGenerationError);
            }
        } catch (e) {
            console.error(e);
            alert(dict.serverError);
        } finally {
            setLoading(false);
        }
    };

    if (score === null || !phaseConfig) return <div className="p-10 text-center text-gray-500 font-medium animate-pulse">{dict.generatingReport}</div>;

    return (
        <main className="min-h-screen flex flex-col items-center bg-gray-50">
            {/* Header Section */}
            <div className={`w-full text-white py-12 px-4 shadow-xl transition-colors duration-500 ${viewMode === 'company' ? 'bg-[#226263]' : 'bg-[#153749]'}`}>
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12">

                    {/* Text Info */}
                    <div className="flex-1 space-y-6 text-center lg:text-left">
                        <div className="text-[#F05324] font-bold tracking-widest uppercase text-sm">{settings?.resultPageTitle || "Strategic Maturity Assessment"}</div>
                        <h1 className="text-4xl md:text-5xl font-bold">{phaseConfig.title}</h1>
                        <h2 className="text-xl md:text-2xl text-[#049978]">{phaseConfig.subtitle}</h2>



                        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6 mt-4">
                            <div className="bg-white/10 px-6 py-3 rounded-xl border border-white/20">
                                <span className="block text-xs text-gray-300 uppercase">{settings?.resultOrganizationLabel || dict.organizationLabelFallback}</span>
                                <span className="font-bold text-xl">{companyName}</span>
                            </div>
                            <div className="bg-[#F05324] px-6 py-3 rounded-xl shadow-lg">
                                <span className="block text-xs text-white/80 uppercase">{settings?.resultScoreLabel || dict.scoreLabelFallback}</span>
                                <span className="font-bold text-2xl">{score.toFixed(2)} / 5.0</span>
                            </div>
                            {communication && communication.count > 0 && (
                                <div className="bg-[#049978] px-6 py-3 rounded-xl shadow-lg">
                                    <span className="block text-xs text-white/80 uppercase">{dict.communicationLabel}</span>
                                    <span className="font-bold text-2xl">{communication.overallAverage.toFixed(2)} / 7.0</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Radar Chart - Conditional rendering based on mode could be cool, but keep simple for now */}
                    <div className="flex-1 w-full lg:max-w-2xl h-[450px] flex items-center justify-center relative">
                        {radarData.length > 0 ? (
                            <MaturityRadar data={radarData} axisColor="white" />
                        ) : (
                            <div className="text-gray-400">{settings?.resultNoDataText || dict.noDataFallback}</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Report Content */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-6xl mx-auto p-2 sm:p-4 -mt-6 md:-mt-10 mb-20 relative z-10">
                {/* Floating Toggle Switch */}
                {companyReport && (
                    <div className="flex justify-center mb-6 w-full">
                        <div className="bg-white rounded-full shadow-lg p-1.5 flex items-center max-w-xl w-full mx-auto border border-gray-100 relative z-20">
                            <button
                                onClick={() => setViewMode('individual')}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 sm:px-6 sm:py-3.5 rounded-full text-xs sm:text-base font-bold transition-all duration-300 ${viewMode === 'individual' ? 'bg-[#153749] text-white shadow-md transform scale-[1.02]' : 'text-gray-500 hover:text-[#153749] hover:bg-gray-50'}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                {settings?.resultPersonalReportBtn || dict.personalReportBtnFallback}
                            </button>
                            <button
                                onClick={() => setViewMode('company')}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 sm:px-6 sm:py-3.5 rounded-full text-xs sm:text-base font-bold transition-all duration-300 ${viewMode === 'company' ? 'bg-[#226263] text-white shadow-md transform scale-[1.02]' : 'text-gray-500 hover:text-[#226263] hover:bg-gray-50'}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                                {settings?.resultCompanyReportBtn || dict.companyReportBtnFallback}
                            </button>
                        </div>
                    </div>
                )}
                
                <div className={`bg-white rounded-3xl shadow-2xl p-4 md:p-8 border min-h-[500px] transition-colors duration-500 relative z-10 ${viewMode === 'company' ? 'border-[#226263]/20' : 'border-[#153749]/20'}`}>
                    {viewMode === 'company' && (
                        <div className="mb-8 p-6 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl flex items-center gap-4">
                            <div className="bg-blue-50 p-2 rounded-lg text-blue-600 shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                            </div>
                            <div className="flex-1">
                                <p className="text-[#153749] text-sm md:text-base leading-relaxed">
                                    {dict.teamNoticePrefix}
                                    <a
                                        href="/my-report"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-bold text-[#F05324] hover:underline transition-all"
                                    >
                                        {dict.teamNoticeLinkText}
                                    </a>
                                    {dict.teamNoticeSuffix}
                                </p>
                            </div>
                        </div>
                    )}

                    {viewMode === 'individual' ? (
                        <ReportView phaseData={phaseConfig} labels={{
                            essence: settings?.phaseEssenceLabel,
                            focus: settings?.phaseFocusLabel
                        }} />
                    ) : (
                        <CompanyReportView data={companyReport} />
                    )}
                </div>

                {(() => {
                    // Company mode shows the company-wide communication aggregate
                    // (from the company-report API), individual mode shows this
                    // respondent's own answers — never blended together.
                    const displayData = viewMode === 'company' && companyReport?.metrics
                        ? {
                            overallAverage: companyReport.metrics.communicationGlobalAverage || 0,
                            count: companyReport.metrics.communicationParticipantCount || 0,
                            byConstruct: Object.fromEntries(
                                Object.entries(companyReport.communicationConstructAverages || {}).map(
                                    ([key, average]: [string, any]) => [key, { average, count: 1, questionIds: [] }]
                                )
                            )
                        }
                        : communication;

                    if (!displayData || displayData.count === 0) return null;
                    return (
                        <div className="mt-8">
                            <CommunicationReportView data={displayData} />
                        </div>
                    );
                })()}

                <div className="mt-12 space-y-8">
                    {/* Booking CTA Block - Shown for both individual and company modes */}
                    <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-8 md:p-10 shadow-sm max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 animate-fadeIn">
                        <div className="flex-1 text-center md:text-left">
                            <h3 className="text-xl md:text-2xl font-bold text-[#153749] leading-tight flex items-center justify-center md:justify-start">
                                {settings?.bookingText || dict.bookingTextFallback}
                            </h3>
                        </div>
                        <div className="shrink-0 w-full md:w-auto flex justify-center">
                            <a
                                href={settings?.bookingLink || 'https://outlook.office.com/book/Bookings1@gec-consulting.com/?ismsaljsauthenabled'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-center bg-[#002D40] text-white px-8 py-4 rounded-xl text-lg font-bold shadow-lg hover:bg-[#003d57] transition-all transform hover:scale-105"
                            >
                                {dict.bookMeetingBtn}
                            </a>
                        </div>
                    </div>

                    {/* Download PDF Button - Only for individual mode */}
                    {viewMode === 'individual' && (
                        <div className="text-center">
                            <button onClick={handleDownloadPDF} disabled={loading} className="bg-[#F05324] text-white px-8 py-4 rounded-full text-lg font-bold shadow-lg hover:bg-orange-600 transition-all disabled:opacity-70">
                                {loading ? dict.generatingReport : (settings?.resultDownloadBtnText || dict.downloadBtnFallback)}
                            </button>
                        </div>
                    )}
                </div>

                <div className="mt-8 text-center">
                    <button onClick={() => router.push('/')} className="text-gray-400 hover:text-[#153749] underline text-sm">
                        {settings?.resultRestartBtnText || dict.restartBtnFallback}
                    </button>
                </div>
            </motion.div>
        </main>
    );
}
