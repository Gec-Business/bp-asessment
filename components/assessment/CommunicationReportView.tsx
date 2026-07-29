"use client";

import { MessageCircle } from "lucide-react";

type CommunicationData = {
    overallAverage: number;
    count: number;
    byConstruct: Record<string, { average: number; count: number; questionIds: number[] }>;
};

const CONSTRUCT_LABELS: Record<string, string> = {
    internal_communication: "შიდა კომუნიკაცია",
    interdepartmental_conflict: "დეპარტამენტთაშორისი კონფლიქტი",
};

function labelForConstruct(key: string) {
    return CONSTRUCT_LABELS[key] || key;
}

export default function CommunicationReportView({ data }: { data: CommunicationData }) {
    if (!data || data.count === 0) return null;

    const constructEntries = Object.entries(data.byConstruct);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8 animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                        <MessageCircle className="text-[#049978]" />
                        კომუნიკაცია
                    </h2>
                    <p className="text-gray-500 mt-2 text-base">
                        ეს არის დამოუკიდებელი შედეგი, რომელიც არ არის გაერთიანებული ბიზნეს პროცესების სიმწიფის ქულასთან.
                    </p>
                </div>
                <div className="text-center bg-teal-50 px-8 py-4 rounded-xl shrink-0">
                    <div className="text-4xl font-bold text-[#049978]">{data.overallAverage.toFixed(2)}</div>
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">კომუნიკაციის საშუალო ქულა</div>
                </div>
            </div>

            {constructEntries.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {constructEntries.map(([key, bucket]) => (
                        <div key={key} className="bg-gray-50 border border-gray-100 rounded-xl p-5 flex items-center justify-between">
                            <span className="font-medium text-gray-700">{labelForConstruct(key)}</span>
                            <span className="text-2xl font-bold text-[#049978]">{bucket.average.toFixed(2)}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
