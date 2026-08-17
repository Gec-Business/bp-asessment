import type { Metadata } from "next";
import { getGlobalSettings } from "@/lib/settings";
import { getLocale, hasStoredLocale } from "@/lib/i18n/getLocale";
import { LocaleProvider } from "@/lib/i18n/LocaleProvider";
import LanguagePromptModal from "@/components/LanguagePromptModal";
import "./globals.css";

const title = "Business Process Maturity Assessment";
const description = "Assess how your operations really run.";
const ogImage = "/og-image.png";

export const metadata: Metadata = {
    metadataBase: new URL("https://ba.gecbusiness.com"),
    title,
    description,
    openGraph: {
        title,
        description,
        url: "https://ba.gecbusiness.com",
        siteName: "GEC Business Growth Services",
        images: [{ url: ogImage, width: 1200, height: 627, alt: title }],
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [ogImage],
    },
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    let baseFontSize = 16;
    try {
        const settings = await getGlobalSettings();
        if (settings?.baseFontSize) {
            baseFontSize = settings.baseFontSize;
        }
    } catch (e) {
        console.error("Failed to fetch base font size:", e);
    }

    const locale = getLocale();
    const storedLocale = hasStoredLocale();

    return (
        <html lang={locale} style={{ fontSize: `${baseFontSize}px` }}>
            <body className="font-sans antialiased text-gray-900 bg-gray-50 dark:bg-gec-navy dark:text-gray-100">
                <LocaleProvider initialLocale={locale} hasStoredLocale={storedLocale}>
                    <LanguagePromptModal />
                    {children}
                </LocaleProvider>
            </body>
        </html>
    );
}
