"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { computeMaturityScore, computeCommunicationScore } from "@/lib/scoring";

type Answer = {
    text: string;
    score: number;
};

type QuestionType = "matrix_1_5" | "likert_1_7";
type ScoringSystem = "maturity" | "communication";

type Question = {
    id: number;
    text: string;
    answers: Answer[];
    questionType: QuestionType;
    scoringSystem: ScoringSystem;
    isReverseScored: boolean;
    construct: string | null;
};

const LIKERT_SCALE = [1, 2, 3, 4, 5, 6, 7];

type AssessmentWizardProps = {
    termsText: string;
};

export default function AssessmentWizard({ termsText }: AssessmentWizardProps) {
    const router = useRouter();
    const [stage, setStage] = useState<"terms" | "quiz" | "declined">("terms");
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, number>>({});

    useEffect(() => {
        if (stage !== "quiz") return;

        // Clear old session data to ensure fresh start
        localStorage.removeItem('assessmentAnswers');
        localStorage.removeItem('assessmentScore');

        const fetchQuestions = async () => {
            try {
                const res = await fetch('/api/admin/questions', { cache: 'no-store' });
                if (res.ok) {
                    const data = await res.json();
                    setQuestions(data);
                }
            } catch (error) {
                console.error("Failed to fetch questions", error);
            } finally {
                setLoading(false);
            }
        };
        fetchQuestions();
    }, [stage]);

    if (stage === "terms") {
        return (
            <div className="w-full max-w-4xl mx-auto bg-white dark:bg-gec-navy p-6 md:p-10 rounded-2xl shadow-xl border border-gray-100 dark:border-gec-teal">
                <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gec-navy dark:text-white">
                    წესები და პირობები
                </h2>
                <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line mb-10">
                    {termsText}
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={() => setStage("quiz")}
                        className="flex-1 px-6 py-4 rounded-xl font-bold text-lg bg-gec-orange text-white hover:opacity-90 transition-opacity shadow-sm"
                    >
                        ვეთანხმები
                    </button>
                    <button
                        onClick={() => setStage("declined")}
                        className="flex-1 px-6 py-4 rounded-xl font-bold text-lg border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-gec-orange hover:text-gec-orange transition-colors"
                    >
                        არ ვეთანხმები
                    </button>
                </div>
            </div>
        );
    }

    if (stage === "declined") {
        return (
            <div className="w-full max-w-4xl mx-auto bg-white dark:bg-gec-navy p-6 md:p-10 rounded-2xl shadow-xl border border-gray-100 dark:border-gec-teal text-center">
                <p className="text-xl font-medium text-gec-navy dark:text-white mb-8">
                    სამწუხაროდ, წესებსა და პირობებზე დათანხმების გარეშე შეფასების გაგრძელება შეუძლებელია.
                </p>
                <button
                    onClick={() => setStage("terms")}
                    className="px-6 py-3 rounded-xl font-bold border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-gec-orange hover:text-gec-orange transition-colors"
                >
                    უკან დაბრუნება
                </button>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gec-orange"></div>
            </div>
        );
    }

    if (questions.length === 0) {
        return <div className="text-center">კითხვები არ მოიძებნა.</div>;
    }

    const currentQuestion = questions[currentQuestionIndex];
    const totalQuestions = questions.length;
    const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

    const handleAnswerSelect = (score: number) => {
        const updatedAnswers = { ...answers, [currentQuestion.id]: score };
        setAnswers(updatedAnswers);

        // Smooth delay before next question
        setTimeout(() => {
            if (currentQuestionIndex < totalQuestions - 1) {
                setCurrentQuestionIndex(currentQuestionIndex + 1);
            } else {
                // Pass updated answers directly to avoid stale state
                handleSubmit(updatedAnswers);
            }
        }, 300);
    };

    const handleSubmit = (finalAnswers?: Record<string, number>) => {
        const answersToUse = finalAnswers || answers;

        // Maturity score — same sum/count formula as before, now explicitly
        // scoped to scoringSystem === 'maturity' answers.
        const { average: averageScore } = computeMaturityScore(questions, answersToUse);
        localStorage.setItem('assessmentScore', averageScore.toFixed(2));

        // Communication score — new, additive only.
        const communication = computeCommunicationScore(questions, answersToUse);
        localStorage.setItem('assessmentCommunication', JSON.stringify(communication));

        // Save answers for submission later
        localStorage.setItem('assessmentAnswers', JSON.stringify(answersToUse));

        // Redirect to Lead Form
        router.push('/assessment/lead-form');
    };

    return (
        <div className="w-full max-w-4xl mx-auto">
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-8 dark:bg-gray-700">
                <div
                    className="bg-gec-orange h-2.5 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={currentQuestion.id}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white dark:bg-gec-navy p-6 md:p-10 rounded-2xl shadow-xl border border-gray-100 dark:border-gec-teal"
                >
                    <h2 className="text-2xl md:text-3xl font-bold mb-8 text-gec-navy dark:text-white leading-relaxed">
                        {currentQuestionIndex + 1}. {currentQuestion.text}
                    </h2>

                    {currentQuestion.questionType === "likert_1_7" ? (
                        <div>
                            <div className="flex justify-center gap-2 sm:gap-3 flex-wrap">
                                {LIKERT_SCALE.map((n) => (
                                    <button
                                        key={n}
                                        onClick={() => handleAnswerSelect(n)}
                                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl border-2 border-transparent bg-gray-50 dark:bg-gec-teal/20 hover:border-gec-orange hover:bg-gec-orange/10 transition-all duration-200 font-bold text-lg text-gec-navy dark:text-gray-200 hover:text-gec-orange"
                                    >
                                        {n}
                                    </button>
                                ))}
                            </div>
                            <div className="mt-4 flex justify-between text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                                <span>სრულიად არ ვეთანხმები</span>
                                <span>სრულიად ვეთანხმები</span>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {currentQuestion.answers.map((answer, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        // CRITICAL FIX: Use explicit value, OR fallback to index + 1
                                        const scoreValue = answer.score ? Number(answer.score) : index + 1;
                                        handleAnswerSelect(scoreValue);
                                    }}
                                    className="w-full text-left p-5 md:p-6 rounded-xl border-2 border-transparent bg-gray-50 dark:bg-gec-teal/20 hover:border-gec-orange hover:bg-gec-orange/10 transition-all duration-200 group flex items-center justify-between"
                                >
                                    <span className="font-medium text-lg md:text-xl text-gec-navy dark:text-gray-200 group-hover:text-gec-orange">{answer.text}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            <div className="mt-8 flex justify-between text-sm text-gray-500">
                <button
                    disabled={currentQuestionIndex === 0}
                    onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                    className="px-4 py-2 hover:text-gec-orange disabled:opacity-50"
                >
                    ← უკან
                </button>
                <span>
                    კითხვა {currentQuestionIndex + 1} / {totalQuestions}
                </span>
            </div>
        </div>
    );
}

