"use client";

import { MessageCircle } from "lucide-react";
import { useDictionary } from "@/lib/i18n/LocaleProvider";

type CommunicationData = {
    overallAverage: number;
    count: number;
    byConstruct: Record<string, { average: number; count: number; questionIds: number[] }>;
};

export default function CommunicationReportView({ data }: { data: CommunicationData }) {
    const dict = useDictionary().communicationReport;
    if (!data || data.count === 0) return null;

    const constructEntries = Object.entries(data.byConstruct);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8 animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                        <MessageCircle className="text-[#049978]" />
                        {dict.heading}
                    </h2>
                    <p className="text-gray-500 mt-2 text-base">
                        {dict.independentNote}
                    </p>
                </div>
                <div className="text-center bg-teal-50 px-8 py-4 rounded-xl shrink-0">
                    <div className="text-4xl font-bold text-[#049978]">{data.overallAverage.toFixed(2)}</div>
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">{dict.averageScoreLabel}</div>
                </div>
            </div>

            {constructEntries.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {constructEntries.map(([key, bucket]) => (
                        <div key={key} className="bg-gray-50 border border-gray-100 rounded-xl p-5 flex items-center justify-between">
                            <span className="font-medium text-gray-700">{key}</span>
                            <span className="text-2xl font-bold text-[#049978]">{bucket.average.toFixed(2)}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
