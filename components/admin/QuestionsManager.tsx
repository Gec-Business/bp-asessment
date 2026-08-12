"use client";

import { useEffect, useMemo, useState } from "react";
import { GripVertical } from "lucide-react";
import { useContentLocale, fieldKey } from "@/lib/i18n/ContentLocaleContext";

// Types matching Prisma model (approx)
type QuestionType = "matrix_1_5" | "likert_1_7";
type ScoringSystem = "maturity" | "communication";

type Answer = {
    id?: number;
    text: string;
    textKa?: string | null;
    score: number;
};

type Question = {
    id: number;
    text: string;
    textKa?: string | null;
    shortLabel: string;
    shortLabelKa?: string | null;
    order: number;
    questionType: QuestionType;
    scoringSystem: ScoringSystem;
    isReverseScored: boolean;
    construct: string | null;
    constructKa?: string | null;
    answers: Answer[];
};

const DEFAULT_MATRIX_ANSWERS: Answer[] = [
    { text: "", score: 1 },
    { text: "", score: 2 },
    { text: "", score: 3 },
    { text: "", score: 4 },
    { text: "", score: 5 },
];

const NEW_QUESTION_TEMPLATE: Question = {
    id: -1,
    text: "New question",
    textKa: "",
    shortLabel: "New Label",
    shortLabelKa: "",
    order: 0,
    questionType: "matrix_1_5",
    scoringSystem: "maturity",
    isReverseScored: false,
    construct: null,
    constructKa: null,
    answers: DEFAULT_MATRIX_ANSWERS.map(a => ({ ...a })),
};

export default function QuestionsManager() {
    const { contentLocale } = useContentLocale();
    const tf = (field: string) => fieldKey(field, contentLocale);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<number | "new" | null>(null);
    const [editForm, setEditForm] = useState<Question | null>(null);
    const [draggedQuestionId, setDraggedQuestionId] = useState<number | null>(null);
    const [dragOverQuestionId, setDragOverQuestionId] = useState<number | null>(null);
    const [draggedAnswerIndex, setDraggedAnswerIndex] = useState<number | null>(null);

    useEffect(() => {
        fetchQuestions();
    }, []);

    const fetchQuestions = async () => {
        try {
            const res = await fetch('/api/admin/questions');
            const data = await res.json();
            setQuestions(data);
        } catch (error) {
            console.error("Failed to fetch questions", error);
        } finally {
            setLoading(false);
        }
    };

    const distinctConstructs = useMemo(
        () => Array.from(new Set(questions.map(q => q.construct).filter((c): c is string => !!c))),
        [questions]
    );

    const handleEdit = (q: Question) => {
        setEditing(q.id);
        setEditForm({ ...q });
    };

    const handleAddNew = () => {
        setEditing("new");
        setEditForm({ ...NEW_QUESTION_TEMPLATE, answers: NEW_QUESTION_TEMPLATE.answers.map(a => ({ ...a })) });
    };

    const handleCancel = () => {
        setEditing(null);
        setEditForm(null);
    };

    const handleTypeChange = (newType: QuestionType) => {
        if (!editForm) return;
        const next: Question = { ...editForm, questionType: newType };

        // Only auto-default Scoring System on a brand-new question — don't
        // silently clobber a saved value while editing an existing one.
        if (editing === "new") {
            next.scoringSystem = newType === "likert_1_7" ? "communication" : "maturity";
        }

        // Reverse-scoring only ever applies to likert_1_7 questions.
        if (newType !== "likert_1_7") {
            next.isReverseScored = false;
        }

        // If switching into matrix_1_5 with no answer rows (e.g. converting
        // an existing likert question), give the admin something to edit.
        if (newType === "matrix_1_5" && next.answers.length === 0) {
            next.answers = DEFAULT_MATRIX_ANSWERS.map(a => ({ ...a }));
        }

        setEditForm(next);
    };

    const handleScoringChange = (newScoring: ScoringSystem) => {
        if (!editForm) return;
        setEditForm({ ...editForm, scoringSystem: newScoring });
    };

    const handleAnswerChange = (idx: number, field: string, value: string | number) => {
        if (!editForm) return;
        const newAnswers = [...editForm.answers];
        newAnswers[idx] = { ...newAnswers[idx], [field]: value };
        setEditForm({ ...editForm, answers: newAnswers });
    };

    const confirmMismatchIfNeeded = (q: Question): boolean => {
        const mismatch =
            (q.questionType === "matrix_1_5" && q.scoringSystem === "communication") ||
            (q.questionType === "likert_1_7" && q.scoringSystem === "maturity");

        if (!mismatch) return true;

        const typeLabel = q.questionType === "matrix_1_5" ? "Matrix (1-5)" : "Likert scale (1-7)";
        const scoringLabel = q.scoringSystem === "maturity" ? "Maturity" : "Communication";
        return confirm(
            `You're pairing "${typeLabel}" with "${scoringLabel}" scoring, which is an unusual combination. Save anyway?`
        );
    };

    const handleSave = async () => {
        if (!editForm) return;
        if (!confirmMismatchIfNeeded(editForm)) return;

        try {
            const res = await fetch('/api/admin/questions', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm),
            });

            if (res.ok) {
                const updated = await res.json();
                setQuestions(questions.map(q => q.id === updated.id ? updated : q));
                setEditing(null);
                setEditForm(null);
            } else {
                alert("Failed to save");
            }
        } catch (error) {
            console.error("Save error", error);
        }
    };

    const handleCreateSave = async () => {
        if (!editForm) return;
        if (!confirmMismatchIfNeeded(editForm)) return;

        try {
            const res = await fetch('/api/admin/questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm),
            });
            if (res.ok) {
                setEditing(null);
                setEditForm(null);
                fetchQuestions(); // Refresh list
            } else {
                alert("Failed to create");
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure?")) return;
        try {
            await fetch(`/api/admin/questions?id=${id}`, { method: 'DELETE' });
            setQuestions(questions.filter(q => q.id !== id));
        } catch (e) {
            console.error(e);
        }
    };

    // --- Question reordering (drag & drop) ---
    const handleQuestionDragStart = (id: number) => setDraggedQuestionId(id);

    const handleQuestionDragOver = (e: React.DragEvent, id: number) => {
        e.preventDefault();
        if (id !== dragOverQuestionId) setDragOverQuestionId(id);
    };

    const handleQuestionDrop = async (targetId: number) => {
        setDragOverQuestionId(null);
        if (draggedQuestionId === null || draggedQuestionId === targetId) return;

        const fromIndex = questions.findIndex(q => q.id === draggedQuestionId);
        const toIndex = questions.findIndex(q => q.id === targetId);
        if (fromIndex === -1 || toIndex === -1) return;

        const reordered = [...questions];
        const [moved] = reordered.splice(fromIndex, 1);
        reordered.splice(toIndex, 0, moved);
        setQuestions(reordered); // optimistic update
        setDraggedQuestionId(null);

        try {
            const res = await fetch('/api/admin/questions/reorder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: reordered.map(q => q.id) })
            });
            if (res.ok) {
                fetchQuestions(); // refresh to pick up the real #order numbers
            } else {
                alert("Failed to save new order");
                fetchQuestions(); // revert to server state
            }
        } catch (e) {
            console.error(e);
            fetchQuestions();
        }
    };

    // --- Answer reordering within the edit form (persisted on Save) ---
    const handleAnswerDragStart = (idx: number) => setDraggedAnswerIndex(idx);

    const handleAnswerDragOver = (e: React.DragEvent) => e.preventDefault();

    const handleAnswerDrop = (targetIdx: number) => {
        if (!editForm || draggedAnswerIndex === null || draggedAnswerIndex === targetIdx) return;
        const reordered = [...editForm.answers];
        const [moved] = reordered.splice(draggedAnswerIndex, 1);
        reordered.splice(targetIdx, 0, moved);
        setEditForm({ ...editForm, answers: reordered });
        setDraggedAnswerIndex(null);
    };

    const renderForm = (isNew: boolean) => {
        if (!editForm) return null;
        const isLikert = editForm.questionType === "likert_1_7";
        const isCommunication = editForm.scoringSystem === "communication";

        return (
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Question Text <span className="text-xs font-normal text-gray-400 uppercase">({contentLocale})</span>
                    </label>
                    <input
                        type="text"
                        value={(editForm as any)[tf('text')] || ""}
                        onChange={(e) => setEditForm({ ...editForm, [tf('text')]: e.target.value } as Question)}
                        className="mt-1 w-full border p-2 rounded text-gray-900 bg-white"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Short Label (for Radar Chart) <span className="text-xs font-normal text-gray-400 uppercase">({contentLocale})</span>
                    </label>
                    <input
                        type="text"
                        value={(editForm as any)[tf('shortLabel')] || ""}
                        onChange={(e) => setEditForm({ ...editForm, [tf('shortLabel')]: e.target.value } as Question)}
                        className="mt-1 w-full border p-2 rounded text-gray-900 bg-white"
                        placeholder="e.g. Org Culture"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Question Type</label>
                        <select
                            value={editForm.questionType}
                            onChange={(e) => handleTypeChange(e.target.value as QuestionType)}
                            className="mt-1 w-full border p-2 rounded text-gray-900 bg-white"
                        >
                            <option value="matrix_1_5">Matrix (1-5)</option>
                            <option value="likert_1_7">Likert scale (1-7)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Scoring System</label>
                        <select
                            value={editForm.scoringSystem}
                            onChange={(e) => handleScoringChange(e.target.value as ScoringSystem)}
                            className="mt-1 w-full border p-2 rounded text-gray-900 bg-white"
                        >
                            <option value="maturity">Maturity (existing)</option>
                            <option value="communication">Communication</option>
                        </select>
                    </div>
                </div>

                {isLikert && (
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <input
                            type="checkbox"
                            checked={editForm.isReverseScored}
                            onChange={(e) => setEditForm({ ...editForm, isReverseScored: e.target.checked })}
                        />
                        Reverse-scored (score = 8 - answer)
                    </label>
                )}

                {isCommunication && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Construct (sub-grouping) <span className="text-xs font-normal text-gray-400 uppercase">({contentLocale})</span>
                        </label>
                        <input
                            type="text"
                            list="construct-options"
                            value={(editForm as any)[tf('construct')] || ""}
                            onChange={(e) => setEditForm({ ...editForm, [tf('construct')]: e.target.value || null } as Question)}
                            className="mt-1 w-full border p-2 rounded text-gray-900 bg-white"
                            placeholder="e.g. internal_communication"
                        />
                        <datalist id="construct-options">
                            {distinctConstructs.map(c => <option key={c} value={c} />)}
                        </datalist>
                    </div>
                )}

                {!isLikert && (
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Answers (drag to reorder) <span className="text-xs font-normal text-gray-400 uppercase">({contentLocale})</span>
                        </label>
                        {editForm.answers.map((ans, idx) => (
                            <div
                                key={idx}
                                className="flex gap-2 items-center"
                                onDragOver={handleAnswerDragOver}
                                onDrop={() => handleAnswerDrop(idx)}
                            >
                                <span
                                    draggable
                                    onDragStart={() => handleAnswerDragStart(idx)}
                                    className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 shrink-0"
                                    title="Drag to reorder"
                                >
                                    <GripVertical size={16} />
                                </span>
                                <input
                                    type="text"
                                    value={(ans as any)[tf('text')] || ""}
                                    onChange={(e) => handleAnswerChange(idx, tf('text'), e.target.value)}
                                    className="flex-1 border p-2 rounded text-sm text-gray-900 bg-white"
                                />
                                <input
                                    type="number"
                                    value={ans.score}
                                    onChange={(e) => handleAnswerChange(idx, 'score', parseInt(e.target.value))}
                                    className="w-16 border p-2 rounded text-sm text-gray-900 bg-white"
                                />
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex gap-2 justify-end">
                    <button onClick={handleCancel} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                    <button
                        onClick={isNew ? handleCreateSave : handleSave}
                        className="px-4 py-2 bg-gec-orange text-white rounded hover:bg-orange-600"
                    >
                        {isNew ? "Create" : "Save"}
                    </button>
                </div>
            </div>
        );
    };

    if (loading) return <div>Loading questions...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <button onClick={handleAddNew} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                    + Add Question
                </button>
            </div>

            {editing === "new" && (
                <div className="bg-white border-2 border-green-500 rounded-lg p-6 shadow-sm">
                    {renderForm(true)}
                </div>
            )}

            {questions.map((q) => (
                <div
                    key={q.id}
                    onDragOver={(e) => editing === null && handleQuestionDragOver(e, q.id)}
                    onDrop={() => editing === null && handleQuestionDrop(q.id)}
                    className={`bg-white border rounded-lg p-6 shadow-sm transition-colors ${dragOverQuestionId === q.id ? "border-gec-orange border-2" : ""}`}
                >
                    {editing === q.id && editForm ? (
                        renderForm(false)
                    ) : (
                        <div>
                            <div className="flex justify-between items-start">
                                <div className="flex items-start gap-3">
                                    {editing === null && (
                                        <span
                                            draggable
                                            onDragStart={() => handleQuestionDragStart(q.id)}
                                            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 mt-1 shrink-0"
                                            title="Drag to reorder"
                                        >
                                            <GripVertical size={18} />
                                        </span>
                                    )}
                                    <div>
                                        <h3 className="font-bold text-lg text-gec-navy">#{q.order} {(q as any)[tf('text')] || q.text}</h3>
                                        <div className="mt-1 flex flex-wrap gap-2 text-xs">
                                            <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                                                {q.questionType === "likert_1_7" ? "Likert (1-7)" : "Matrix (1-5)"}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded ${q.scoringSystem === "communication" ? "bg-teal-100 text-teal-700" : "bg-orange-100 text-orange-700"}`}>
                                                {q.scoringSystem === "communication" ? "Communication" : "Maturity"}
                                            </span>
                                            {q.isReverseScored && (
                                                <span className="px-2 py-0.5 rounded bg-red-100 text-red-700">Reverse-scored</span>
                                            )}
                                            {q.construct && (
                                                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700">{q.construct}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <button
                                        onClick={() => handleEdit(q)}
                                        className="text-sm text-gec-orange hover:underline"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(q.id)}
                                        className="text-sm text-red-500 hover:underline"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                            {q.questionType === "likert_1_7" ? (
                                <p className="mt-4 text-sm text-gray-500">Fixed 1–7 scale (no custom answer text).</p>
                            ) : (
                                <ul className="mt-4 space-y-1">
                                    {q.answers.map((ans, i) => (
                                        <li key={i} className="text-sm text-gray-600 flex justify-between">
                                            <span>• {(ans as any)[tf('text')] || ans.text}</span>
                                            <span className="font-mono text-gray-400">({ans.score})</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
