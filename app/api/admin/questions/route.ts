export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { questions as initialQuestions } from "@/lib/questions";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getLocaleFromRequest } from "@/lib/i18n/getLocaleFromRequest";
import { localizeQuestion } from "@/lib/i18n/localize";

// GET: Fetch all questions (ordered). Admin (authenticated) requests get raw
// bilingual rows for editing; public requests get localized single-language data.
export async function GET(req: NextRequest) {
    const locale = getLocaleFromRequest(req);
    const isAdmin = !!(await getServerSession(authOptions));
    try {
        const questions = await prisma.question.findMany({
            include: { answers: { orderBy: { order: 'asc' } } },
            orderBy: { order: 'asc' }
        });

        // Seed logic if empty
        if (questions.length === 0) {
            for (const q of initialQuestions) {
                await prisma.question.create({
                    data: {
                        text: q.text,
                        order: q.id, // Using ID as initial order
                        answers: {
                            create: q.answers.map((a: any, idx: number) => ({
                                text: a.text,
                                score: a.score,
                                order: idx
                            }))
                        }
                    }
                });
            }
            // Re-fetch
            const seeded = await prisma.question.findMany({
                include: { answers: { orderBy: { order: 'asc' } } },
                orderBy: { order: 'asc' }
            });
            return NextResponse.json(isAdmin ? seeded : seeded.map((q) => localizeQuestion(q, locale)));
        }

        return NextResponse.json(isAdmin ? questions : questions.map((q) => localizeQuestion(q, locale)));
    } catch (error) {
        console.error("Failed to fetch questions:", error);
        return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
    }
}

// POST: Create a new question
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const {
            text,
            textKa,
            shortLabel,
            shortLabelKa,
            answers,
            questionType = "matrix_1_5",
            scoringSystem = "maturity",
            isReverseScored = false,
            construct = null,
            constructKa = null,
        } = body; // answers: { text, textKa, score }[] — only used for matrix_1_5

        const count = await prisma.question.count();
        const isLikert = questionType === "likert_1_7";

        const newQuestion = await prisma.question.create({
            data: {
                text,
                textKa,
                shortLabel: shortLabel || "",
                shortLabelKa,
                order: count + 1,
                questionType,
                scoringSystem,
                // Defense in depth: reverse-scoring only ever applies to likert_1_7 questions.
                isReverseScored: isLikert ? !!isReverseScored : false,
                construct: scoringSystem === "communication" ? (construct || null) : null,
                constructKa: scoringSystem === "communication" ? (constructKa || null) : null,
                ...(isLikert
                    ? {}
                    : {
                        answers: {
                            create: (answers || []).map((a: any, idx: number) => ({
                                text: a.text,
                                textKa: a.textKa,
                                score: parseInt(a.score),
                                order: idx
                            }))
                        }
                    })
            },
            include: { answers: { orderBy: { order: 'asc' } } }
        });

        return NextResponse.json(newQuestion);
    } catch (error) {
        console.error("Create Question Error:", error);
        return NextResponse.json({ error: "Failed to create question" }, { status: 500 });
    }
}

// PUT: Update a question
export async function PUT(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const {
            id,
            text,
            textKa,
            shortLabel,
            shortLabelKa,
            answers,
            questionType = "matrix_1_5",
            scoringSystem = "maturity",
            isReverseScored = false,
            construct = null,
            constructKa = null,
        } = body;
        const isLikert = questionType === "likert_1_7";

        // Transaction to update question and replace answers
        const updated = await prisma.$transaction(async (tx) => {
            // Update Text & Short Label & new fields
            await tx.question.update({
                where: { id: parseInt(id) },
                data: {
                    text,
                    textKa,
                    shortLabel: shortLabel || "",
                    shortLabelKa,
                    questionType,
                    scoringSystem,
                    isReverseScored: isLikert ? !!isReverseScored : false,
                    construct: scoringSystem === "communication" ? (construct || null) : null,
                    constructKa: scoringSystem === "communication" ? (constructKa || null) : null,
                }
            });

            // Delete existing answers (simplest strategy for MVP) — also handles
            // cleanup when a question is converted from matrix_1_5 to likert_1_7.
            await tx.answer.deleteMany({
                where: { questionId: parseInt(id) }
            });

            // Create new answers — only meaningful for matrix_1_5 questions.
            if (!isLikert && answers && answers.length > 0) {
                await tx.answer.createMany({
                    data: answers.map((a: any, idx: number) => ({
                        text: a.text,
                        textKa: a.textKa,
                        score: parseInt(a.score),
                        order: idx,
                        questionId: parseInt(id)
                    }))
                });
            }

            return tx.question.findUnique({
                where: { id: parseInt(id) },
                include: { answers: { orderBy: { order: 'asc' } } }
            });
        });

        return NextResponse.json(updated);

    } catch (error) {
        console.error("Update Question Error:", error);
        return NextResponse.json({ error: "Failed to update question" }, { status: 500 });
    }
}

// DELETE: Remove a question
export async function DELETE(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

        await prisma.question.delete({
            where: { id: parseInt(id) }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete Question Error:", error);
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
}
