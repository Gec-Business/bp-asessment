export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLocaleFromRequest } from "@/lib/i18n/getLocaleFromRequest";
import { localizeWhyItem } from "@/lib/i18n/localize";

export async function GET(req: NextRequest) {
    const locale = getLocaleFromRequest(req);
    try {
        const items = await prisma.whyItem.findMany({
            orderBy: { order: 'asc' }
        });
        return NextResponse.json(items.map((i) => localizeWhyItem(i, locale)));
    } catch (error) {
        console.error("Failed to fetch why items", error);
        return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 });
    }
}
