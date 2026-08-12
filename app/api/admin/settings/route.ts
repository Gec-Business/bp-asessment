export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getLocaleFromRequest } from "@/lib/i18n/getLocaleFromRequest";
import { localizeGlobalSettings } from "@/lib/i18n/localize";

// Admin (authenticated) requests get the raw bilingual row for editing;
// public requests get localized data with defensive fallback text.
export async function GET(req: NextRequest) {
    const locale = getLocaleFromRequest(req);
    const isAdmin = !!(await getServerSession(authOptions));
    const defaultBookingText = 'If you would like a further discussion with the GEC team, or assistance developing your organization\'s strategic direction, book a meeting with us.';
    const defaultBookingLink = 'https://outlook.office.com/book/Bookings1@gec-consulting.com/?ismsaljsauthenabled';
    const defaultTermsText = 'Please review and agree to the terms and conditions to continue with the assessment.';

    try {
        let settings = await prisma.globalSettings.findFirst();
        if (!settings) {
            settings = await prisma.globalSettings.create({
                data: {} // Uses defaults
            });
        }

        if (isAdmin) return NextResponse.json(settings);

        // Ensure booking fields have defaults if null
        const localized = localizeGlobalSettings(settings, locale);
        return NextResponse.json({
            ...localized,
            bookingText: localized.bookingText || defaultBookingText,
            bookingLink: localized.bookingLink || defaultBookingLink,
            termsAndConditionsText: localized.termsAndConditionsText || defaultTermsText
        });
    } catch (error) {
        console.error("Fetch settings error:", error);
        // P2022 or other errors: return a dummy object with defaults
        const dummySettings = {
            id: 1,
            logoUrl: "/logo.png",
            heroTitle: "Business Process Maturity Assessment",
            heroSubtitle: "Determine your company's stage of development and get recommendations for the next steps.",
            buttonText: "Start Assessment",
            footerText: "© 2026 GEC Business. All rights reserved.",
            bookingText: defaultBookingText,
            bookingLink: defaultBookingLink,
            termsAndConditionsText: defaultTermsText,
            logoWidth: 256,
            baseFontSize: 16
        };
        return NextResponse.json(dummySettings);
    }
}

export async function PUT(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        // Upsert ID 1
        const settings = await prisma.globalSettings.upsert({
            where: { id: 1 },
            update: body,
            create: { ...body, id: 1 }
        });
        return NextResponse.json(settings);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
    }
}
