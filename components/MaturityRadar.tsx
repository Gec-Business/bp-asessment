"use client";

import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

const CustomTick = ({ payload, x, y, cx, cy, axisColor, data, ...rest }: any) => {
    // Try to find the full text using the index (if available) or matching the subject
    const item = data?.[payload.index];
    const fullText = item?.fullSubject || payload.value;

    return (
        <text
            y={y + (y - cy) / 10}
            x={x + (x - cx) / 10}
            textAnchor="middle"
            fill={axisColor}
            fontSize={13}
            fontWeight={500}
            className="cursor-help"
        >
            {payload.value}
            <title>{fullText}</title>
        </text>
    );
};

type RadarProps = {
    data: {
        subject: string;
        fullSubject?: string;
        A: number;
        fullMark: number;
    }[];
    axisColor?: string;
};

export default function MaturityRadar({ data, axisColor = "white" }: RadarProps) {
    if (!data || data.length === 0) {
        return <div className={`text-center p-4 ${axisColor === 'white' ? 'text-white' : 'text-gray-500'}`}>Not enough data to generate chart.</div>;
    }

    return (
        <div className="w-full h-[400px] flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                    <PolarGrid stroke={axisColor === 'white' ? "rgba(255, 255, 255, 0.2)" : "rgba(0,0,0,0.1)"} />
                    <PolarAngleAxis
                        dataKey="subject"
                        tick={<CustomTick axisColor={axisColor} data={data} />}
                    />
                    <PolarRadiusAxis
                        angle={90}
                        domain={[0, 5]}
                        tickCount={6}
                        tick={{ fill: axisColor, fontSize: 10, fontWeight: 'bold' }}
                        axisLine={false}
                    />
                    <Radar
                        name="Company Score"
                        dataKey="A"
                        stroke="#F05324"
                        strokeWidth={4}
                        fill="#F05324"
                        fillOpacity={0.2}
                        isAnimationActive={true}
                        dot={{ r: 4, fill: "#F05324", strokeWidth: 0, stroke: "#fff" }}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
}
