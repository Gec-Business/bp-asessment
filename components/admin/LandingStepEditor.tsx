"use client";

import { useState, useEffect } from "react";
import IconPicker from "./IconPicker";

type StepItem = {
    id: number;
    stepNumber: number;
    title: string;
    subtitle: string;
    icon: string;
    description: string; // JSON string: { essence, characteristics, focus }
};

type ParsedDescription = {
    essence: string;
    characteristics: string[];
    focus: string[];
};

function parseDescription(desc: string): ParsedDescription {
    try {
        const parsed = JSON.parse(desc);
        return {
            essence: parsed.essence || "",
            characteristics: Array.isArray(parsed.characteristics) ? parsed.characteristics : [],
            focus: Array.isArray(parsed.focus) ? parsed.focus : [],
        };
    } catch {
        return { essence: desc || "", characteristics: [], focus: [] };
    }
}

function buildDescription(parsed: ParsedDescription): string {
    return JSON.stringify({
        essence: parsed.essence,
        characteristics: parsed.characteristics,
        focus: parsed.focus,
    });
}

export default function LandingStepEditor() {
    const [steps, setSteps] = useState<StepItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<number | null>(null);
    const [editingStep, setEditingStep] = useState<number | null>(null);

    // Editing fields
    const [editTitle, setEditTitle] = useState("");
    const [editSubtitle, setEditSubtitle] = useState("");
    const [editIcon, setEditIcon] = useState("");
    const [editEssence, setEditEssence] = useState("");
    const [editCharacteristics, setEditCharacteristics] = useState("");
    const [editFocus, setEditFocus] = useState("");

    useEffect(() => {
        fetchSteps();
    }, []);

    const fetchSteps = async () => {
        try {
            const res = await fetch("/api/landing-steps");
            const data = await res.json();
            setSteps(data);
        } catch (e) {
            console.error("Failed to load steps", e);
        } finally {
            setLoading(false);
        }
    };

    const startEditing = (step: StepItem) => {
        setEditingStep(step.id);
        setEditTitle(step.title);
        setEditSubtitle(step.subtitle);
        setEditIcon(step.icon || "Box");

        const parsed = parseDescription(step.description);
        setEditEssence(parsed.essence);
        setEditCharacteristics(parsed.characteristics.join("\n"));
        setEditFocus(parsed.focus.join("\n"));
    };

    const cancelEditing = () => {
        setEditingStep(null);
    };

    const saveStep = async (step: StepItem) => {
        setSaving(step.id);

        const description = buildDescription({
            essence: editEssence,
            characteristics: editCharacteristics.split("\n").map(s => s.trim()).filter(Boolean),
            focus: editFocus.split("\n").map(s => s.trim()).filter(Boolean),
        });

        try {
            const res = await fetch("/api/landing-steps", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: step.id,
                    title: editTitle,
                    subtitle: editSubtitle,
                    icon: editIcon,
                    description,
                }),
            });

            if (res.ok) {
                await fetchSteps();
                setEditingStep(null);
            } else {
                alert("Failed to save step");
            }
        } catch (e) {
            console.error("Save error:", e);
            alert("Failed to save step");
        } finally {
            setSaving(null);
        }
    };

    if (loading) {
        return <div className="text-center py-12 text-gray-500">Loading Landing Steps...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-700">Landing Page Steps ({steps.length})</h2>
            </div>

            {steps.map((step) => (
                <div key={step.id} className="border rounded-xl p-6 bg-gray-50 hover:bg-white transition-colors">
                    {editingStep === step.id ? (
                        /* ─── EDIT MODE ─── */
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-xs font-bold text-gray-400 uppercase">Step {step.stepNumber}</span>
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Editing</span>
                            </div>

                            {/* Title & Subtitle */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Title</label>
                                    <input
                                        type="text"
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 focus:outline-none bg-white text-black"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Subtitle</label>
                                    <input
                                        type="text"
                                        value={editSubtitle}
                                        onChange={(e) => setEditSubtitle(e.target.value)}
                                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 focus:outline-none bg-white text-black"
                                    />
                                </div>
                            </div>

                            {/* Icon */}
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Icon (Lucide name)</label>
                                <IconPicker
                                    value={editIcon}
                                    onChange={setEditIcon}
                                />
                            </div>

                            {/* 3-Column Content Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t">
                                {/* Essence */}
                                <div>
                                    <label className="block text-sm font-medium text-orange-600 mb-1">ძირითადი არსი (Essence)</label>
                                    <textarea
                                        value={editEssence}
                                        onChange={(e) => setEditEssence(e.target.value)}
                                        rows={5}
                                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-300 focus:outline-none resize-none bg-white text-black"
                                        placeholder="Main essence description..."
                                    />
                                </div>

                                {/* Characteristics */}
                                <div>
                                    <label className="block text-sm font-medium text-teal-600 mb-1">მახასიათებლები (one per line)</label>
                                    <textarea
                                        value={editCharacteristics}
                                        onChange={(e) => setEditCharacteristics(e.target.value)}
                                        rows={5}
                                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-300 focus:outline-none resize-none bg-white text-black"
                                        placeholder={"Characteristic 1\nCharacteristic 2\nCharacteristic 3"}
                                    />
                                </div>

                                {/* Focus */}
                                <div>
                                    <label className="block text-sm font-medium text-yellow-600 mb-1">ფოკუსი (one per line)</label>
                                    <textarea
                                        value={editFocus}
                                        onChange={(e) => setEditFocus(e.target.value)}
                                        rows={5}
                                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-300 focus:outline-none resize-none bg-white text-black"
                                        placeholder={"Focus area 1\nFocus area 2\nFocus area 3"}
                                    />
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => saveStep(step)}
                                    disabled={saving === step.id}
                                    className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition disabled:opacity-50"
                                >
                                    {saving === step.id ? "Saving..." : "Save"}
                                </button>
                                <button
                                    onClick={cancelEditing}
                                    className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* ─── VIEW MODE ─── */
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-xs font-bold text-gray-400 uppercase">Step {step.stepNumber}</span>
                                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{step.icon}</span>
                                </div>
                                <h3 className="font-bold text-gray-800 text-lg">{step.title}</h3>
                                <p className="text-sm text-gray-500 italic mb-3">{step.subtitle}</p>

                                {/* Preview the 3 fields */}
                                {(() => {
                                    const parsed = parseDescription(step.description);
                                    return (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-3 p-3 bg-white rounded-lg border">
                                            <div>
                                                <span className="font-semibold text-orange-600 text-xs uppercase">Essence</span>
                                                <p className="text-gray-600 mt-1 line-clamp-3">{parsed.essence || "—"}</p>
                                            </div>
                                            <div>
                                                <span className="font-semibold text-teal-600 text-xs uppercase">Characteristics</span>
                                                <p className="text-gray-600 mt-1">{parsed.characteristics.length} items</p>
                                            </div>
                                            <div>
                                                <span className="font-semibold text-yellow-600 text-xs uppercase">Focus</span>
                                                <p className="text-gray-600 mt-1">{parsed.focus.length} items</p>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                            <button
                                onClick={() => startEditing(step)}
                                className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition shrink-0"
                            >
                                Edit
                            </button>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
