import AssessmentWizard from "@/components/AssessmentWizard";
import { getGlobalSettings } from "@/lib/settings";
import { getLocale } from "@/lib/i18n/getLocale";
import { localizeGlobalSettings } from "@/lib/i18n/localize";

export const dynamic = 'force-dynamic';

async function getSettings(locale: ReturnType<typeof getLocale>) {
    const settings = await getGlobalSettings();
    if (!settings) {
        return locale === "ka"
            ? {
                assessmentPageTitle: "სტრატეგიული შეფასება",
                assessmentPageSubtitle: "გთხოვთ უპასუხოთ კითხვებს გულწრფელად",
                termsAndConditionsText: "შეფასების გასაგრძელებლად გთხოვთ გაეცნოთ წესებსა და პირობებს და დაეთანხმოთ მათ."
            }
            : {
                assessmentPageTitle: "Strategic Assessment",
                assessmentPageSubtitle: "Please answer the questions honestly",
                termsAndConditionsText: "Please review and agree to the terms and conditions to continue with the assessment."
            };
    }
    return localizeGlobalSettings(settings, locale);
}

export default async function AssessmentPage() {
    const locale = getLocale();
    const settings = await getSettings(locale);

    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gec-navy">
            <div className="w-full max-w-4xl">
                <header className="mb-14 text-center">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gec-navy dark:text-white mb-4 leading-tight">
                        {settings.assessmentPageTitle}
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 font-medium">
                        {settings.assessmentPageSubtitle}
                    </p>
                </header>

                <AssessmentWizard termsText={settings.termsAndConditionsText || ""} />
            </div>
        </main>
    );
}

