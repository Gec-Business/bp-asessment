import React from 'react';
import * as icons from 'lucide-react';

// Helper to render icon by string name
const DynamicIcon = ({ name, className }: { name: string, className?: string }) => {
    // @ts-ignore
    const LucideIcon = (icons as any)[name];
    if (!LucideIcon) return null;
    return <LucideIcon className={className} />;
};

type PhaseData = {
    id: number;
    title: string;
    subtitle: string;
    color: string;
    icon: string;
    essence: string;
    focus: string;
    meaningPoints: { icon?: string; title: string; desc: string }[];
    manifestation: {
        strategy: string[];
        leadership: string[];
        processes: string[];
    };
    challenges: { icon?: string; title: string; desc: string }[];
    benefits: { color?: string; title: string; desc: string }[];
    recommendations: string;
};

const BENEFIT_COLORS: Record<string, string> = {
    red: "#F05324",
    yellow: "#F0B91C",
    green: "#049978",
};

export default function ReportView({ phaseData, labels }: {
    phaseData: PhaseData;
    labels?: { essence?: string; focus?: string; }
}) {
    // phaseData comes from the DB (PhaseConfig)

    return (
        <div className="max-w-7xl mx-auto bg-white min-h-screen font-sans">

            {/* --- HEADER --- */}
            <div className="bg-[#153749] text-white p-6 md:p-12 text-center rounded-t-3xl relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-lg md:text-2xl opacity-80 mb-2">თქვენი ორგანიზაციის ბიზნეს პროცესების სიმწიფის შეფასება:</h2>
                    <h1 className="text-3xl md:text-5xl font-bold text-[#F05324] mb-4">ფაზა {phaseData.id}: {phaseData.title}</h1>
                    <p className="text-sm md:text-xl uppercase tracking-widest text-[#049978] mb-8">{phaseData.subtitle}</p>

                    {/* Main Phase Icon */}
                    <div className="flex justify-center mb-6">
                        <div className="p-4 bg-white/10 rounded-full">
                            <DynamicIcon name={phaseData.icon} className="w-16 h-16 text-white" />
                        </div>
                    </div>
                </div>
            </div>

            {/* --- CORE: Essence & Focus --- */}
            <div className="p-4 md:p-12 grid grid-cols-1 md:grid-cols-2 gap-8 bg-white border-b border-gray-100">
                <div className="bg-orange-50 p-6 md:p-8 rounded-2xl border border-orange-100">
                    <h3 className="text-[#F05324] font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                        <span className="p-2 bg-[#F05324] text-white rounded-lg"><DynamicIcon name="Target" className="w-4 h-4" /></span>
                        {labels?.essence || "არსი (Essence)"}
                    </h3>
                    <p className="text-gray-700 text-base md:text-lg leading-relaxed font-medium break-words">
                        {phaseData.essence}
                    </p>
                </div>
                <div className="bg-teal-50 p-6 md:p-8 rounded-2xl border border-teal-100">
                    <h3 className="text-[#049978] font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                        <span className="p-2 bg-[#049978] text-white rounded-lg"><DynamicIcon name="Crosshair" className="w-4 h-4" /></span>
                        {labels?.focus || "ფოკუსი (Focus)"}
                    </h3>
                    <p className="text-gray-700 text-base md:text-lg leading-relaxed font-medium break-words">
                        {phaseData.focus}
                    </p>
                </div>
            </div>

            {/* --- SECTION 1: What this phase means --- */}
            <div className="p-6 md:p-12 bg-gray-50">
                <h3 className="text-2xl md:text-3xl font-bold text-[#153749] mb-8 text-center">
                    რას ნიშნავს ფაზა {phaseData.id}?
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                    {phaseData.meaningPoints && phaseData.meaningPoints.map((point, idx) => (
                        <div key={idx} className="bg-white p-6 rounded-xl shadow-md border-t-4 border-[#049978] flex items-start">
                            <div className="mr-4 text-[#F05324] mt-1">
                                {/* Fallback to CheckCircle if no specific icon */}
                                <DynamicIcon name={point.icon || "CheckCircle2"} className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-[#153749] mb-2">{point.title}</h4>
                                <p className="text-sm text-gray-600 leading-relaxed">{point.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- SECTION 2: How it manifests (3 Columns from PDF Page 6) --- */}
            <div className="p-6 md:p-12">
                <h3 className="text-2xl md:text-3xl font-bold text-[#153749] mb-8 text-center">
                    როგორ ვლინდება ეს თქვენი ორგანიზაციის საქმიანობაში?
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-0 rounded-2xl overflow-hidden shadow-xl">
                    {/* Column 1: Strategy */}
                    <div className="bg-[#F05324] p-6 md:p-8 text-white">
                        <h4 className="font-bold text-lg md:text-xl mb-4 text-center border-b border-white/30 pb-4">სტრატეგია და პროცესები</h4>
                        <ul className="space-y-4 list-disc pl-5">
                            {phaseData.manifestation?.strategy?.map((item, i) => <li key={i} className="break-words">{item}</li>)}
                        </ul>
                    </div>
                    {/* Column 2: Leadership */}
                    <div className="bg-[#153749] p-6 md:p-8 text-white">
                        <h4 className="font-bold text-lg md:text-xl mb-4 text-center border-b border-white/30 pb-4">ბიზნეს პროცესები</h4>
                        <ul className="space-y-4 list-disc pl-5">
                            {phaseData.manifestation?.leadership?.map((item, i) => <li key={i} className="break-words">{item}</li>)}
                        </ul>
                    </div>
                    {/* Column 3: Processes */}
                    <div className="bg-[#049978] p-6 md:p-8 text-white">
                        <h4 className="font-bold text-lg md:text-xl mb-4 text-center border-b border-white/30 pb-4">ხარისხი და შედეგები</h4>
                        <ul className="space-y-4 list-disc pl-5">
                            {phaseData.manifestation?.processes?.map((item, i) => <li key={i} className="break-words">{item}</li>)}
                        </ul>
                    </div>
                </div>
            </div>

            {/* --- SECTION 3: Challenges (PDF Page 6 Bottom) --- */}
            <div className="p-6 md:p-12 bg-gray-50">
                <h3 className="text-2xl md:text-3xl font-bold text-[#F05324] mb-8">
                    რა არის ტიპური გამოწვევები ამ ფაზაში?
                </h3>
                <div className="space-y-6">
                    {phaseData.challenges && phaseData.challenges.map((challenge, idx) => (
                        <div key={idx} className="flex items-start bg-white p-4 rounded-lg shadow-sm">
                            <div className="mr-4 min-w-[40px]">
                                <DynamicIcon name={challenge.icon || "AlertTriangle"} className="w-8 h-8 text-[#F05324]" />
                            </div>
                            <div>
                                <h5 className="font-bold text-[#153749]">{challenge.title}</h5>
                                <p className="text-gray-600">{challenge.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- SECTION 4: Benefits of moving to the next phase --- */}
            {phaseData.benefits && phaseData.benefits.length > 0 && (
                <div className="p-6 md:p-12">
                    <h3 className="text-2xl md:text-3xl font-bold text-[#153749] mb-8 text-center">
                        რა დადებით შედეგებს მოგვიტანს განვითარების შემდეგ ეტაპზე გადასვლა?
                    </h3>
                    <div className="space-y-6 max-w-4xl mx-auto">
                        {phaseData.benefits.map((benefit, idx) => {
                            const hex = BENEFIT_COLORS[benefit.color || "green"] || BENEFIT_COLORS.green;
                            return (
                                <div key={idx} className="flex items-start gap-4">
                                    <div
                                        className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
                                        style={{ backgroundColor: hex }}
                                    >
                                        <DynamicIcon name="ChevronsLeft" className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h5 className="font-bold" style={{ color: hex }}>{benefit.title}</h5>
                                        <p className="text-gray-600 leading-relaxed">{benefit.desc}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

        </div>
    );
}
