export type QuestionType = "matrix_1_5" | "likert_1_7";
export type ScoringSystem = "maturity" | "communication";

export type ScoringQuestion = {
    id: number;
    questionType: QuestionType;
    scoringSystem: ScoringSystem;
    isReverseScored: boolean;
    construct: string | null;
};

export type AnswersMap = Record<string | number, number | string>;

function getRawAnswer(answers: AnswersMap, questionId: number): number | null {
    const raw = answers[questionId] ?? answers[String(questionId)];
    if (raw === undefined || raw === null || raw === "") return null;
    const num = Number(raw);
    return isNaN(num) ? null : num;
}

// Reverse scoring only ever applies to the communication (likert_1_7) system.
function getEffectiveScore(raw: number, q: Pick<ScoringQuestion, "isReverseScored" | "scoringSystem">): number {
    if (q.scoringSystem === "communication" && q.isReverseScored) {
        return 8 - raw;
    }
    return raw;
}

export function computeMaturityScore(
    questions: ScoringQuestion[],
    answers: AnswersMap
): { average: number; count: number } {
    const values: number[] = [];
    questions
        .filter(q => q.scoringSystem === "maturity")
        .forEach(q => {
            const raw = getRawAnswer(answers, q.id);
            if (raw !== null) values.push(raw);
        });

    const count = values.length || 1;
    const average = values.reduce((a, b) => a + b, 0) / count;
    return { average, count: values.length };
}

export function computeCommunicationScore(
    questions: ScoringQuestion[],
    answers: AnswersMap
): {
    overallAverage: number;
    count: number;
    byConstruct: Record<string, { average: number; count: number; questionIds: number[] }>;
} {
    const communicationQuestions = questions.filter(q => q.scoringSystem === "communication");

    const scored: { q: ScoringQuestion; value: number }[] = [];
    communicationQuestions.forEach(q => {
        const raw = getRawAnswer(answers, q.id);
        if (raw !== null) {
            scored.push({ q, value: getEffectiveScore(raw, q) });
        }
    });

    const overallCount = scored.length || 1;
    const overallAverage = scored.reduce((sum, s) => sum + s.value, 0) / overallCount;

    const byConstruct: Record<string, { average: number; count: number; questionIds: number[] }> = {};
    scored.forEach(({ q, value }) => {
        if (!q.construct) return;
        if (!byConstruct[q.construct]) {
            byConstruct[q.construct] = { average: 0, count: 0, questionIds: [] };
        }
        byConstruct[q.construct].questionIds.push(q.id);
        byConstruct[q.construct].count += 1;
        byConstruct[q.construct].average += value;
    });
    Object.values(byConstruct).forEach(bucket => {
        bucket.average = bucket.count > 0 ? bucket.average / bucket.count : 0;
    });

    return { overallAverage, count: scored.length, byConstruct };
}
