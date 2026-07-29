"use client";

import { useState, useRef } from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { Download, User } from 'lucide-react';

type OverlayDataPoint = {
    subject: string;
    fullMark: number;
    [key: string]: string | number; // leadId: score
};

type AggregateDataPoint = {
    subject: string;
    fullMark: number;
    average: number;
    median: number;
};

type LeadInfo = {
    id: string;
    name: string;
    email: string;
};

type Props = {
    overlayData: OverlayDataPoint[];
    leads: LeadInfo[];
    aggregateData: AggregateDataPoint[];
};

export default function CompanyRadars({ overlayData, leads, aggregateData }: Props) {
    const [hoveredLeadId, setHoveredLeadId] = useState<string | null>(null);
    const overlayChartRef = useRef<HTMLDivElement>(null);
    const aggregateChartRef = useRef<HTMLDivElement>(null);

    const downloadChart = async (ref: React.RefObject<HTMLDivElement>, filename: string) => {
        if (!ref.current) return;

        // Find the SVG
        const svgElement = ref.current.querySelector('svg');
        if (!svgElement) return;

        // Serialize SVG logic
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svgElement);
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            // Double resolution for retina quality
            const scale = 2;
            canvas.width = (svgElement.clientWidth || 500) * scale;
            canvas.height = (svgElement.clientHeight || 500) * scale;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.scale(scale, scale);
                // Fill white background
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width / scale, canvas.height / scale);
                ctx.drawImage(img, 0, 0, svgElement.clientWidth || 500, svgElement.clientHeight || 500);

                const pngUrl = canvas.toDataURL('image/png');
                const downloadLink = document.createElement('a');
                downloadLink.href = pngUrl;
                downloadLink.download = `${filename}.png`;
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
            }
            URL.revokeObjectURL(url);
        };
        img.src = url;
    };

    return (
        <div className="space-y-12">
            {/* Chart 1: Employee Alignment (Overlay) */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8">
                <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Employee Alignment (Overlay Radar)</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Hover over an employee name to highlight their specific maturity profile. Dense areas indicate strong team alignment.
                        </p>
                    </div>
                    <button
                        onClick={() => downloadChart(overlayChartRef, 'employee_alignment_radar')}
                        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gec-orange transition-colors"
                    >
                        <Download size={16} />
                        Download PNG
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    {/* The Chart */}
                    <div className="lg:col-span-3 h-[500px]" ref={overlayChartRef}>
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={overlayData}>
                                <PolarGrid stroke="#e5e7eb" />
                                <PolarAngleAxis
                                    dataKey="subject"
                                    tick={<CustomTick data={overlayData} />}
                                />
                                <PolarRadiusAxis
                                    angle={90}
                                    domain={[0, 5]}
                                    tickCount={6}
                                    tick={{ fill: '#9CA3AF', fontSize: 10 }}
                                    axisLine={false}
                                />
                                {leads.map((lead) => {
                                    const isHovered = hoveredLeadId === lead.id;
                                    const isDimmed = hoveredLeadId !== null && !isHovered;

                                    return (
                                        <Radar
                                            key={lead.id}
                                            name={lead.name}
                                            dataKey={lead.id}
                                            stroke={isHovered ? "#B91C1C" : "#F05324"}
                                            strokeWidth={isHovered ? 3 : 1}
                                            strokeOpacity={isHovered ? 1 : (isDimmed ? 0.05 : 0.4)}
                                            fill={isHovered ? "#F05324" : "#F0B91C"}
                                            fillOpacity={isHovered ? 0.5 : (isDimmed ? 0.05 : 0.15)}
                                            style={{ mixBlendMode: 'multiply' }}
                                            isAnimationActive={false}
                                        />
                                    );
                                })}
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Interactive Legend */}
                    <div className="lg:col-span-1 h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        <div className="text-xs font-bold text-gray-400 uppercase mb-3 tracking-wider">Employees</div>
                        <div className="space-y-1">
                            {leads.map((lead) => (
                                <div
                                    key={lead.id}
                                    onMouseEnter={() => setHoveredLeadId(lead.id)}
                                    onMouseLeave={() => setHoveredLeadId(null)}
                                    className={`
                                        group flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all duration-200
                                        ${hoveredLeadId === lead.id ? 'bg-orange-50 border-orange-100 shadow-sm' : 'hover:bg-gray-50 border border-transparent'}
                                    `}
                                >
                                    <div className={`p-1.5 rounded-full ${hoveredLeadId === lead.id ? 'bg-white text-gec-orange' : 'bg-gray-100 text-gray-400 group-hover:bg-white'}`}>
                                        <User size={14} />
                                    </div>
                                    <div className="overflow-hidden">
                                        <div className={`text-sm font-semibold truncate ${hoveredLeadId === lead.id ? 'text-gray-900' : 'text-gray-700'}`}>
                                            {lead.name}
                                        </div>
                                        <div className="text-xs text-gray-400 truncate">{lead.email}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Chart 2: Average vs Median */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8">
                <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Average vs. Median Score</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Comparing the Arithmetic Mean against the Median helps identify if extreme outliers are skewing the company score.
                        </p>
                    </div>
                    <button
                        onClick={() => downloadChart(aggregateChartRef, 'average_vs_median_radar')}
                        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gec-orange transition-colors"
                    >
                        <Download size={16} />
                        Download PNG
                    </button>
                </div>

                <div className="w-full h-[500px]" ref={aggregateChartRef}>
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={aggregateData}>
                            <PolarGrid stroke="#e5e7eb" />
                            <PolarAngleAxis
                                dataKey="subject"
                                tick={<CustomTick data={aggregateData} />}
                            />
                            <PolarRadiusAxis
                                angle={90}
                                domain={[0, 5]}
                                tickCount={6}
                                tick={{ fill: '#9CA3AF', fontSize: 10 }}
                                axisLine={false}
                            />
                            <Radar
                                name="Average (Mean)"
                                dataKey="average"
                                stroke="#00A98F"
                                strokeWidth={2}
                                fill="#00A98F"
                                fillOpacity={0.2}
                            />
                            <Radar
                                name="Median"
                                dataKey="median"
                                stroke="#F05324"
                                strokeWidth={3}
                                strokeDasharray="5 5"
                                fill="#F05324"
                                fillOpacity={0.0}
                            />
                            <Legend verticalAlign="bottom" height={36} />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

const CustomTick = ({ payload, x, y, cx, cy, data, ...rest }: any) => {
    const item = data?.[payload.index];
    const fullText = item?.fullSubject || payload.value;
    return (
        <text
            {...rest}
            y={y + (y - cy) / 10}
            x={x + (x - cx) / 10}
            textAnchor="middle"
            fill="#153749"
            fontSize={12}
            fontWeight={600}
        >
            {payload.value}
            <title>{fullText}</title>
        </text>
    );
};
