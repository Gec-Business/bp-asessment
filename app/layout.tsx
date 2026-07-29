import type { Metadata } from "next";
import { getGlobalSettings } from "@/lib/settings";
import "./globals.css";

export const metadata: Metadata = {
    title: "GEC Business Processes Maturity Assessment",
    description: "Assess your company's strategic maturity level.",
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

    return (
        <html lang="ka" style={{ fontSize: `${baseFontSize}px` }}>
            <body className="font-sans antialiased text-gray-900 bg-gray-50 dark:bg-gec-navy dark:text-gray-100">{children}</body>
        </html>
    );
}
