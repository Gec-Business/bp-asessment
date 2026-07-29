"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Sprout, Target, BarChart3, Gem, Box } from "lucide-react";

type StepData = {
    id: number;
    stepNumber: number;
    title: string;
    subtitle: string;
    color: string;
    description: string;
    icon: any; // React Component
};

const ICON_MAP: Record<string, any> = {
    "Flame": Flame,
    "Sprout": Sprout,
    "Target": Target,
    "BarChart3": BarChart3,
    "Gem": Gem,
    "Box": Box
};

const initialSteps: StepData[] = [];

const PHASE_COLORS = ["#049978", "#F0B91C", "#F05324", "#049978", "#F0B91C"];

export default function EvolutionPath({ labels }: { labels?: { essence?: string; characteristics?: string; focus?: string; } }) {
    const [activeStep, setActiveStep] = useState<number | null>(null);
    const [steps, setSteps] = useState<StepData[]>(initialSteps);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPhases();
    }, []);

    const fetchPhases = async () => {
        try {
            const res = await fetch("/api/landing-steps");
            const data = await res.json();

            if (data.length > 0) {
                const mapped = data.map((d: any, i: number) => ({
                    id: d.id,
                    stepNumber: d.stepNumber,
                    title: d.title,
                    subtitle: d.subtitle,
                    color: PHASE_COLORS[i % 5],
                    description: d.description,
                    icon: ICON_MAP[d.icon] || Box
                }));
                setSteps(mapped);
            }
        } catch (e) {
            console.error("Failed to load landing steps", e);
        } finally {
            setLoading(false);
        }
    };

    const handleStepClick = (id: number) => {
        if (activeStep === id) {
            setActiveStep(null);
        } else {
            setActiveStep(id);
        }
    };

    return (
        <div className="w-full relative py-8 px-4">
            {/* S-Shape Path SVG Background (Desktop Only Visual Guide) */}
            <div className="absolute top-[88px] left-0 w-full h-4 bg-gradient-to-r from-gec-teal/20 via-gec-teal/40 to-gec-teal/20 -z-10 hidden md:block rounded-full blur-sm"></div>

            {/* Steps Grid */}
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-0 relative">
                {loading ? (
                    // Skeleton Loader
                    Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="relative flex flex-col items-center group animate-pulse">
                            <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-white/10 border-4 border-white/20"></div>
                            <div className="mt-6 w-24 h-4 bg-white/10 rounded"></div>
                            <div className="mt-2 w-16 h-3 bg-white/5 rounded"></div>
                        </div>
                    ))
                ) : (
                    steps.map((step, index) => (
                        <div key={step.id} className="relative flex flex-col items-center group">

                            {/* Circle Button */}
                            <div className="relative">
                                {/* Pulse Effect for Active Step */}
                                {activeStep === step.id && (
                                    <motion.div
                                        // layoutId="pulse" removed
                                        className="absolute inset-0 rounded-full z-0"
                                        initial={{ scale: 1, opacity: 0.5 }}
                                        animate={{ scale: 1.5, opacity: 0 }}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                        style={{ backgroundColor: step.color }}
                                    />
                                )}

                                <motion.button
                                    onClick={() => handleStepClick(step.id)}
                                    className={`relative z-10 w-16 h-16 md:w-24 md:h-24 rounded-full flex items-center justify-center border-4 shadow-xl transition-all duration-500
                                    ${activeStep === step.id
                                            ? "ring-4 ring-offset-4 ring-offset-gec-navy ring-white z-20"
                                            : "opacity-100 scale-90 hover:scale-100 bg-white/10 backdrop-blur-sm hover:bg-white/20"
                                        }`}
                                    style={{
                                        backgroundColor: step.color,
                                        borderColor: activeStep === step.id ? "#ffffff" : "#153749",
                                        boxShadow: activeStep === step.id ? `0 0 40px ${step.color}90` : "none",
                                        filter: activeStep === step.id ? "none" : "grayscale(30%)"
                                    }}
                                    animate={activeStep === step.id ? {
                                        scale: 1.2,
                                    } : { scale: 0.9 }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    {activeStep === step.id ? (
                                        <step.icon className="w-8 h-8 md:w-10 md:h-10 text-white drop-shadow-md" />
                                    ) : (
                                        <span className={`text-2xl md:text-3xl font-extrabold font-mono text-white/90 drop-shadow-sm`}>
                                            0{step.stepNumber}
                                        </span>
                                    )}
                                </motion.button>
                            </div>

                            {/* Labels */}
                            <div className={`mt-4 md:mt-6 text-center transition-all duration-300 ${activeStep === step.id ? 'opacity-100 scale-105' : 'opacity-80'} md:bg-transparent bg-black/40 backdrop-blur-md md:backdrop-blur-none px-4 py-2.5 rounded-xl border border-white/10 md:border-transparent md:px-0 md:py-0 relative z-10`}>
                                <h3 className="font-extrabold text-lg leading-tight tracking-tight uppercase" style={{ color: step.color }}>{step.title}</h3>
                                <p className="text-xs text-gray-300 mt-1 font-semibold">{step.subtitle}</p>
                            </div>

                            {/* Mobile Connector Line */}
                            {index < steps.length - 1 && (
                                <div className="absolute top-16 bottom-0 left-1/2 w-1 bg-gec-teal opacity-20 -z-10 md:hidden transform -translate-x-1/2 h-full"></div>
                            )}

                            {/* Mobile Details: Accordion Style */}
                            <div className="md:hidden w-full">
                                <AnimatePresence>
                                    {activeStep === step.id && (() => {
                                        // Logic for Details Parsing (Repetitive but scoped)
                                        // To avoid repetition, we could extract `details` fetching but since it's inside map, it's cheap (just parsing string)
                                        const parseContent = (content: string) => {
                                            try { return JSON.parse(content); } catch { return null; }
                                        };
                                        const details = parseContent(step.description);

                                        return (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.3 }}
                                                className="overflow-hidden bg-white/5 mx-4 mt-4 mb-2 rounded-xl border border-white/10 backdrop-blur-sm"
                                            >
                                                <div className="p-6">
                                                    {details ? (
                                                        <div className="space-y-6 text-left">
                                                            <div>
                                                                <h4 className="text-[#F05324] font-bold uppercase tracking-wider mb-2 text-xs">
                                                                    {labels?.essence || "ძირითადი არსი"}
                                                                </h4>
                                                                <p className="text-white text-sm font-medium leading-relaxed break-words">{details.essence}</p>
                                                            </div>
                                                            <div>
                                                                <h4 className="text-[#F05324] font-bold uppercase tracking-wider mb-2 text-xs">
                                                                    {labels?.characteristics || "საკვანძო მახასიათებლები"}
                                                                </h4>
                                                                <ul className="space-y-1">
                                                                    {details.characteristics?.map((item: string, i: number) => (
                                                                        <li key={i} className="text-gray-300 text-xs flex items-start break-words">
                                                                            <span className="mr-2 text-[#049978]">•</span> {item}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                            <div>
                                                                <h4 className="text-[#F05324] font-bold uppercase tracking-wider mb-2 text-xs">
                                                                    {labels?.focus || "ფოკუსი"}
                                                                </h4>
                                                                <ul className="space-y-1">
                                                                    {details.focus?.map((item: string, i: number) => (
                                                                        <li key={i} className="text-gray-300 text-xs flex items-start break-words">
                                                                            <span className="mr-2 text-[#F0B91C]">•</span> {item}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="text-white text-sm leading-relaxed">{step.description}</p>
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })()}
                                </AnimatePresence>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Desktop Expanded Content Area (hidden on mobile) */}
            <div className="hidden md:block">
                <AnimatePresence mode="wait">
                    {activeStep && (() => {
                        const activeStepData = steps.find(s => s.id === activeStep);
                        if (!activeStepData) return null;

                        // Parse JSON description for 3-column layout
                        const parseContent = (content: string) => {
                            try {
                                return JSON.parse(content);
                            } catch {
                                return null;
                            }
                        };
                        const details = parseContent(activeStepData.description);

                        return (
                            <motion.div
                                key={activeStep}
                                initial={{ opacity: 0, height: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, height: "auto", y: 0, scale: 1 }}
                                exit={{ opacity: 0, height: 0, y: 20, scale: 0.95 }}
                                transition={{ duration: 0.4, ease: "easeOut" }}
                                className="w-full max-w-5xl mx-auto mt-12 overflow-hidden"
                            >
                                <div className="bg-white/5 rounded-3xl p-8 border border-white/10 backdrop-blur-md">
                                    {details ? (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                                            {/* Column 1: Essence */}
                                            <div className="border-b md:border-b-0 md:border-r border-white/20 pb-6 md:pb-0 md:pr-6">
                                                <h4 className="text-[#F05324] font-bold uppercase tracking-wider mb-4 text-sm">
                                                    {labels?.essence || "ძირითადი არსი"}
                                                </h4>
                                                <p className="text-white text-lg font-medium leading-relaxed">{details.essence}</p>
                                            </div>

                                            {/* Column 2: Characteristics */}
                                            <div className="border-b md:border-b-0 md:border-r border-white/20 pb-6 md:pb-0 md:px-6">
                                                <h4 className="text-[#F05324] font-bold uppercase tracking-wider mb-4 text-sm">
                                                    {labels?.characteristics || "საკვანძო მახასიათებლები"}
                                                </h4>
                                                <ul className="space-y-2">
                                                    {details.characteristics?.map((item: string, i: number) => (
                                                        <li key={i} className="text-gray-300 text-sm flex items-start">
                                                            <span className="mr-2 text-[#049978]">•</span> {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            {/* Column 3: Focus */}
                                            <div className="md:pl-6">
                                                <h4 className="text-[#F05324] font-bold uppercase tracking-wider mb-4 text-sm">
                                                    {labels?.focus || "ფოკუსი"}
                                                </h4>
                                                <ul className="space-y-2">
                                                    {details.focus?.map((item: string, i: number) => (
                                                        <li key={i} className="text-gray-300 text-sm flex items-start">
                                                            <span className="mr-2 text-[#F0B91C]">•</span> {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    ) : (
                                        /* Fallback for plain text (old data) */
                                        <p className="text-white text-lg leading-relaxed">{activeStepData.description}</p>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })()}
                </AnimatePresence>
            </div>
        </div>
    );
}
