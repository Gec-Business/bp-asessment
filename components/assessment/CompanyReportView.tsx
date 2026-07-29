"use client";

import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { Building, Users, TrendingUp, TrendingDown, AlertCircle, CheckCircle, Info } from 'lucide-react';

type ReportData = {
    domain: string;
    metrics: {
        globalAverage: number;
        participantCount: number;
    };
    overlayData: any[];
    aggregateData: any[];
    insights: {
        strongest: { subject: string; average: number; fullSubject?: string };
        weakest: { subject: string; average: number; fullSubject?: string };
        consensus: { subject: string; variance: number; fullSubject?: string };
        divergence: { subject: string; variance: number; fullSubject?: string };
    };
};

export default function CompanyReportView({ data }: { data: ReportData }) {
    // Collect anonymous keys for overlay
    const overlayKeys = Object.keys(data.overlayData[0] || {}).filter(k => k.startsWith('anon_'));

    return (
        <div className="space-y-12 animate-fadeIn">
            {/* Header Metrics */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                            <Building className="text-gec-orange" />
                            {data.domain} - გუნდის საერთო ანგარიში
                        </h2>
                        <p className="text-gray-500 mt-2 text-base">
                            ეს ანგარიში ეყრდნობა გუნდის <strong className="text-[#F05324] text-lg">{data.metrics.participantCount}</strong> წევრის შეფასებას.
                        </p>
                    </div>
                    <div className="text-center bg-blue-50 px-8 py-4 rounded-xl">
                        <div className="text-4xl font-bold text-[#F05324]">{data.metrics.globalAverage.toFixed(2)}</div>
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">გუნდის სიმწიფის ქულა</div>
                    </div>
                </div>
            </div>

            {/* Insights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <InsightCard
                    icon={<TrendingUp size={24} className="text-green-500" />}
                    title="ყველაზე ძლიერი მხარე"
                    value={data.insights.strongest?.subject}
                    valueTooltip={data.insights.strongest?.fullSubject}
                    subValue={`საშუალო: ${data.insights.strongest?.average?.toFixed(2)}`}
                    color="green"
                    tooltip="ის განზომილება, რომელშიც გუნდს ყველაზე მაღალი საშუალო ქულა აქვს."
                />
                <InsightCard
                    icon={<TrendingDown size={24} className="text-red-500" />}
                    title="ყველაზე სუსტი მხარე"
                    value={data.insights.weakest?.subject}
                    valueTooltip={data.insights.weakest?.fullSubject}
                    subValue={`საშუალო: ${data.insights.weakest?.average?.toFixed(2)}`}
                    color="red"
                    tooltip="ის განზომილება, რომელშიც გუნდს ყველაზე დაბალი საშუალო ქულა აქვს."
                />
                <InsightCard
                    icon={<CheckCircle size={24} className="text-blue-500" />}
                    title="მაღალი თანხვედრა"
                    value={data.insights.consensus?.subject}
                    valueTooltip={data.insights.consensus?.fullSubject}
                    subValue="გუნდი თანხმდება"
                    color="blue"
                    tooltip="განზომილება, სადაც პასუხები ყველაზე მეტად ემთხვევა ერთმანეთს (ყველაზე დაბალი ვარიაცია)."
                />
                <InsightCard
                    icon={<AlertCircle size={24} className="text-orange-500" />}
                    title="ყველაზე დიდი აცდენა"
                    value={data.insights.divergence?.subject}
                    valueTooltip={data.insights.divergence?.fullSubject}
                    subValue="აზრთა სხვადასხვაობა"
                    color="orange"
                    tooltip="განზომილება, სადაც გუნდის წევრებს შორის ყველაზე დიდი აზრთა სხვადასხვაობაა (მაღალი ვარიაცია)."
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Overlay Radar (Anonymous Heatmap) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">გუნდის თანხვედრის რუკა (Heatmap)</h3>
                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data.overlayData}>
                                <PolarGrid stroke="#e5e7eb" />
                                <PolarAngleAxis dataKey="subject" tick={<CustomTick data={data.overlayData} />} />
                                <PolarRadiusAxis angle={90} domain={[0, 5]} tick={false} axisLine={false} />
                                {overlayKeys.map(key => (
                                    <Radar
                                        key={key}
                                        dataKey={key}
                                        stroke="#F05324"
                                        strokeWidth={1}
                                        strokeOpacity={0.4}
                                        fill="#F0B91C"
                                        fillOpacity={0.15}
                                        style={{ mixBlendMode: 'multiply' }}
                                        isAnimationActive={false}
                                    />
                                ))}
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Avg vs Median */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">საშუალო ქულა მედიანის წინააღმდეგ</h3>
                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data.aggregateData}>
                                <PolarGrid stroke="#e5e7eb" />
                                <PolarAngleAxis dataKey="subject" tick={<CustomTick data={data.aggregateData} />} />
                                <PolarRadiusAxis angle={90} domain={[0, 5]} tick={false} axisLine={false} />
                                <Radar
                                    name="საშუალო"
                                    dataKey="average"
                                    stroke="#00A98F"
                                    strokeWidth={3}
                                    fill="#00A98F"
                                    fillOpacity={0.2}
                                />
                                <Radar
                                    name="მედიანა"
                                    dataKey="median"
                                    stroke="#F05324"
                                    strokeWidth={3}
                                    strokeDasharray="5 5"
                                    fill="#F05324"
                                    fillOpacity={0}
                                />
                                <Legend />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}

const CustomTick = ({ payload, x, y, cx, cy, data, ...rest }: any) => {
    // Try to find the full text using the index (if available) or matching the subject
    const item = data?.[payload.index];
    const fullText = item?.fullSubject || payload.value;

    return (
        <text
            y={y + (y - cy) / 10}
            x={x + (x - cx) / 10}
            textAnchor="middle"
            fill="#153749"
            fontSize={13}
            fontWeight={500}
            className="cursor-help"
        >
            {payload.value}
            <title>{fullText}</title>
        </text>
    );
};

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
                    <div className="text-gec-orange opacity-40 hover:opacity-100 cursor-help transition-opacity" title={valueTooltip}>
                        <Info size={14} />
                    </div>
                )}
            </div>
            <div className="text-xs text-gray-500">{subValue}</div>
        </div>
    );
}
