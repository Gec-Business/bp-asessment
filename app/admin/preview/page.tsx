"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play } from "lucide-react";

export default function PreviewPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [score, setScore] = useState(3.5);
    const [communicationScore, setCommunicationScore] = useState(4.0);

    const generatePreview = async () => {
        setLoading(true);
        try {
            // Fetch questions to generate dummy answers
            const res = await fetch("/api/admin/questions");
            const questions = await res.json();

            // Create dummy answers map
            const dummyAnswers: Record<string, number> = {};
            questions.forEach((q: any) => {
                const isCommunication = q.scoringSystem === "communication";
                const scale = isCommunication ? 7 : 5;

                // For reverse-scored communication questions, the raw answer must
                // be generated around (scale+1 - target) so that after the app's
                // own 8-raw reversal, the EFFECTIVE score lands near the target
                // the admin actually asked for.
                const target = isCommunication && q.isReverseScored
                    ? (scale + 1) - communicationScore
                    : (isCommunication ? communicationScore : score);

                const variance = (Math.random() * 1.5 - 0.75) * (scale / 5);
                let val = target + variance;
                if (val > scale) val = scale;
                if (val < 1) val = 1;
                dummyAnswers[q.id] = isCommunication ? Math.round(val) : Math.round(val * 10) / 10;
            });

            // Set localStorage for personal report
            localStorage.setItem("assessmentScore", score.toString());
            localStorage.setItem("userName", "Test User");
            localStorage.setItem("companyName", "Test Group LLC");
            localStorage.setItem("assessmentEmail", "test@example.com");
            localStorage.setItem("assessmentAnswers", JSON.stringify(dummyAnswers));

            // Redirect to result page with preview flag
            router.push("/result?preview=true");
        } catch (e) {
            console.error("Failed to generate preview", e);
            alert("Error connecting to the server.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto animate-fadeIn">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Generate Test Report</h1>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-xl">
                <p className="text-gray-600 mb-6">
                    From this page you can open the final report page with ideal test data (including a <strong>varied team report</strong>), without having to fill out the questionnaire from scratch.
                </p>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Test Personal Score (1.0 - 5.0)
                    </label>
                    <input
                        type="number"
                        min="1"
                        max="5"
                        step="0.1"
                        value={score}
                        onChange={(e) => setScore(parseFloat(e.target.value))}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F05324]/50 focus:border-[#F05324]"
                    />
                    <p className="text-xs text-gray-500 mt-2">This score determines which stage/phase appears in the personal report.</p>
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Test Communication Score (1.0 - 7.0)
                    </label>
                    <input
                        type="number"
                        min="1"
                        max="7"
                        step="0.1"
                        value={communicationScore}
                        onChange={(e) => setCommunicationScore(parseFloat(e.target.value))}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#049978]/50 focus:border-[#049978]"
                    />
                    <p className="text-xs text-gray-500 mt-2">This score determines the reading in the independent &quot;Communication&quot; section of the report.</p>
                </div>

                <button
                    onClick={generatePreview}
                    disabled={loading}
                    className="w-full bg-[#153749] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#002D40] transition-colors disabled:opacity-70"
                >
                    <Play size={20} />
                    {loading ? "Preparing..." : "Open Test Report"}
                </button>
            </div>
        </div>
    );
}
