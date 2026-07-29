export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const items = await prisma.whyItem.findMany({
            orderBy: { order: 'asc' }
        });
        return NextResponse.json(items);
    } catch (error) {
        console.error("Failed to fetch why items", error);
        return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 });
    }
}
