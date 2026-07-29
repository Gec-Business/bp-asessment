import AssessmentWizard from "@/components/AssessmentWizard";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

async function getSettings() {
    const settings = await prisma.globalSettings.findFirst();
    return settings || {
        assessmentPageTitle: "სტრატეგიული შეფასება",
        assessmentPageSubtitle: "გთხოვთ უპასუხოთ კითხვებს გულწრფელად",
        termsAndConditionsText: "შეფასების გასაგრძელებლად გთხოვთ გაეცნოთ წესებსა და პირობებს და დაეთანხმოთ მათ."
    };
}

export default async function AssessmentPage() {
    const settings = await getSettings();

    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gec-navy">
            <div className="w-full max-w-4xl">
                <header className="mb-14 text-center">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gec-navy dark:text-white mb-4 leading-tight">
                        {settings.assessmentPageTitle || "სტრატეგიული შეფასება"}
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 font-medium">
                        {settings.assessmentPageSubtitle || "გთხოვთ უპასუხოთ კითხვებს გულწრფელად"}
                    </p>
                </header>

                <AssessmentWizard termsText={settings.termsAndConditionsText || ""} />
            </div>
        </main>
    );
}

