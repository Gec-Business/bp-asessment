export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
    const defaultBookingText = 'თუ გსურთ დამატებითი განხილვა GEC-ის გუნდთან, ან დახმარება ორგანიზაციის სტრატეგიულ განვითარებაში, დაჯავშნეთ შეხვედრა ჩვენთან.';
    const defaultBookingLink = 'https://outlook.office.com/book/Bookings1@gec-consulting.com/?ismsaljsauthenabled';
    const defaultTermsText = 'შეფასების გასაგრძელებლად გთხოვთ გაეცნოთ წესებსა და პირობებს და დაეთანხმოთ მათ.';

    try {
        let settings = await prisma.globalSettings.findFirst();
        if (!settings) {
            settings = await prisma.globalSettings.create({
                data: {} // Uses defaults
            });
        }

        // Ensure booking fields have defaults if null
        return NextResponse.json({
            ...settings,
            bookingText: settings.bookingText || defaultBookingText,
            bookingLink: settings.bookingLink || defaultBookingLink,
            termsAndConditionsText: settings.termsAndConditionsText || defaultTermsText
        });
    } catch (error) {
        console.error("Fetch settings error:", error);
        // P2022 or other errors: return a dummy object with defaults
        const dummySettings = {
            id: 1,
            logoUrl: "/logo.png",
            heroTitle: "ბიზნეს პროცესების სიმწიფის შეფასება",
            heroSubtitle: "განსაზღვრეთ თქვენი კომპანიის განვითარების ეტაპი და მიიღეთ რეკომენდაციები შემდეგი ნაბიჯებისთვის.",
            buttonText: "შეფასების დაწყება",
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
