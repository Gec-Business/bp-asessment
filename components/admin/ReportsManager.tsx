"use client";

import { useEffect, useState, useCallback } from "react";
import BlockListEditor from './BlockListEditor';

type PhaseConfig = {
    id: number;
    title: string;
    subtitle: string;
    meaningPoints: string; // JSON string
    manifestation: string; // JSON string
    challenges: string; // JSON string
    benefits: string; // JSON string
    recommendations: string;
    essence: string; // New field
    focus: string; // JSON string (List)
};

export default function ReportsManager() {
    const [phases, setPhases] = useState<PhaseConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [activePhase, setActivePhase] = useState<number>(1);
    const [form, setForm] = useState<PhaseConfig | null>(null);

    const fetchPhases = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/phases");
            const data = await res.json();
            setPhases(data);
            // Only set form if it's null (initial load)
            setForm(currentForm => currentForm || (data.length > 0 ? data[0] : null));
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, []); // Empty dependency array as we use functional state update for form

    useEffect(() => {
        fetchPhases();
    }, [fetchPhases]);

    const handleTabClick = (id: number) => {
        setActivePhase(id);
        const p = phases.find(ph => ph.id === id);
        if (p) setForm(p);
    };

    const handleSave = async () => {
        if (!form) return;
        try {
            const res = await fetch("/api/admin/phases", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            if (res.ok) {
                alert("Saved!");
                fetchPhases(); // Refresh
            } else {
                alert("Error saving");
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleFieldChange = (field: keyof PhaseConfig, value: string) => {
        if (form) setForm({ ...form, [field]: value });
    };

    if (loading) return <div>Loading...</div>;
    if (!form) return <div>No config found</div>;

    return (
        <div className="flex flex-col gap-6">
            {/* Tabs */}
            <div className="flex bg-gray-100 p-1 rounded-lg overflow-x-auto">
                {phases.map((p) => (
                    <button
                        key={p.id}
                        onClick={() => handleTabClick(p.id)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activePhase === p.id
                            ? "bg-white text-gec-navy shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        {p.id}. {p.title}
                    </button>
                ))}
            </div>

            {/* Editor */}
            <div className="bg-white border rounded-xl p-6 shadow-sm space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">Title</label>
                        <input
                            value={form.title}
                            onChange={e => handleFieldChange("title", e.target.value)}
                            className="w-full border p-2 rounded text-gray-900"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">Subtitle</label>
                        <input
                            value={form.subtitle}
                            onChange={e => handleFieldChange("subtitle", e.target.value)}
                            className="w-full border p-2 rounded text-gray-900"
                        />
                    </div>
                </div>





                <div>
                    <BlockListEditor
                        label="Meaning Points (Cards)"
                        value={form.meaningPoints}
                        onChange={(val) => handleFieldChange("meaningPoints", val)}
                        fields={[
                            { name: "icon", label: "Icon", type: "icon" },
                            { name: "title", label: "Title", type: "text", placeholder: "e.g. Daily Firefighting" },
                            { name: "desc", label: "Description", type: "textarea", placeholder: "Description..." }
                        ]}
                    />
                </div>

                {/* Manifestation is an object {strategy: [], leadership: [], processes: []}, 
                    so we need a way to edit 3 separate lists. 
                    We'll parse it here for the UI and sync back. 
                */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-gray-50 rounded-xl border">
                    <div className="col-span-full font-bold text-gray-700">Manifestation (Lists)</div>

                    {['strategy', 'leadership', 'processes'].map((key) => {
                        // Manifestation is stored as a JSON string of an object containing arrays of strings.
                        // BlockListEditor expects a JSON string of objects.
                        // We need a temporary adapter or a simpler "StringListEditor".
                        // For speed, let's use BlockListEditor with a single field "text" and adapt the data.

                        // Adapter Logic:
                        let currentList: string[] = [];
                        try {
                            const parsed = JSON.parse(form.manifestation || "{}");
                            currentList = parsed[key] || [];
                        } catch (e) { currentList = [] }

                        // Convert ["item1"] -> [{"text": "item1"}] for BlockListEditor
                        const adapterValue = JSON.stringify(currentList.map(t => ({ text: t })));

                        return (
                            <div key={key}>
                                <BlockListEditor
                                    label={key.charAt(0).toUpperCase() + key.slice(1)}
                                    value={adapterValue}
                                    onChange={(newVal) => {
                                        // Convert [{"text": "item1"}] back to ["item1"]
                                        try {
                                            const newObjs = JSON.parse(newVal);
                                            const strings = newObjs.map((o: any) => o.text);

                                            const oldManifestation = JSON.parse(form.manifestation || "{}");
                                            const newManifestation = { ...oldManifestation, [key]: strings };
                                            handleFieldChange("manifestation", JSON.stringify(newManifestation));
                                        } catch (e) { console.error(e) }
                                    }}
                                    fields={[{ name: "text", label: "Item", type: "textarea", placeholder: "Detail..." }]}
                                />
                            </div>
                        );
                    })}
                </div>

                <div>
                    <BlockListEditor
                        label="Challenges"
                        value={form.challenges}
                        onChange={(val) => handleFieldChange("challenges", val)}
                        fields={[
                            { name: "icon", label: "Icon", type: "icon" },
                            { name: "title", label: "Title", type: "text", placeholder: "Title" },
                            { name: "desc", label: "Description", type: "textarea", placeholder: "Description" }
                        ]}
                    />
                </div>

                <div>
                    <BlockListEditor
                        label="რა დადებით შედეგებს მოგვიტანს განვითარების შემდეგ ეტაპზე გადასვლა?"
                        value={form.benefits}
                        onChange={(val) => handleFieldChange("benefits", val)}
                        fields={[
                            { name: "color", label: "Color", type: "color" },
                            { name: "title", label: "Title", type: "text", placeholder: "e.g. პროგნოზირებადი შედეგები" },
                            { name: "desc", label: "Description", type: "textarea", placeholder: "Description..." }
                        ]}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Recommendations</label>
                    <textarea
                        value={form.recommendations}
                        onChange={e => setForm({ ...form, recommendations: e.target.value })}
                        className="w-full border p-2 rounded h-20 text-gray-900"
                    />
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={handleSave}
                        className="bg-gec-orange text-white px-6 py-2 rounded-lg font-bold hover:opacity-90"
                    >
                        Save Configuration
                    </button>
                </div>
            </div>
        </div>

    );
}
