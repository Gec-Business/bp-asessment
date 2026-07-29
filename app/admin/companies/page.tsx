import { prisma } from "@/lib/prisma";
import CompaniesTable from "@/components/admin/CompaniesTable";
import { computeCommunicationScore } from "@/lib/scoring";

export const dynamic = 'force-dynamic';

const PUBLIC_DOMAINS = [
    'gmail.com',
    'yahoo.com',
    'hotmail.com',
    'outlook.com',
    'icloud.com',
    'mail.ru',
    'yandex.ru',
    'live.com',
    'protonmail.com',
    'aol.com',
    'zoho.com',
    'gmx.com'
];

type LeadSubset = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    score: number;
    communicationScore: number | null;
    createdAt: Date;
};

type CompanyStats = {
    domain: string;
    companyName: string;
    leadCount: number;
    avgScore: number;
    avgCommunicationScore: number;
    communicationLeadCount: number;
    lastSubmission: Date;
    leads: LeadSubset[];
};

export default async function CompaniesPage() {
    // 1. Fetch all leads with results
    const leads = await prisma.lead.findMany({
        include: {
            results: {
                orderBy: { createdAt: 'desc' },
                take: 1
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    // Needed to compute each lead's independent Communication score from their
    // raw stored answers (Result.answers already has everything, no new column).
    const questions = await prisma.question.findMany();

    // 2. Group by Domain & Filter
    const companyMap = new Map<string, CompanyStats>();

    for (const lead of leads) {
        if (!lead.email || !lead.email.includes('@')) continue;

        const domain = lead.email.split('@')[1].toLowerCase();

        // FAIL-FAST: Skip public domains
        if (PUBLIC_DOMAINS.includes(domain)) continue;

        const score = lead.results[0]?.score || 0;

        // Communication is a separate, independent scoring system — computed
        // here from the same stored answers, never blended into `score` above.
        let communicationScore: number | null = null;
        try {
            if (lead.results[0]?.answers) {
                const answers = JSON.parse(lead.results[0].answers);
                const communication = computeCommunicationScore(questions as any, answers);
                if (communication.count > 0) communicationScore = communication.overallAverage;
            }
        } catch (e) { /* ignore malformed answers */ }

        if (!companyMap.has(domain)) {
            companyMap.set(domain, {
                domain,
                companyName: lead.company || domain, // fallback to domain if company name missing
                leadCount: 0,
                avgScore: 0, // accum
                avgCommunicationScore: 0, // accum
                communicationLeadCount: 0,
                lastSubmission: lead.createdAt,
                leads: []
            });
        }

        const stats = companyMap.get(domain)!;
        stats.leadCount += 1;
        stats.avgScore += score;
        if (communicationScore !== null) {
            stats.avgCommunicationScore += communicationScore;
            stats.communicationLeadCount += 1;
        }

        // Update stats
        if (lead.createdAt > stats.lastSubmission) {
            stats.lastSubmission = lead.createdAt;
            if (lead.company) stats.companyName = lead.company; // update name to most recent
        }

        // Add to leads list
        stats.leads.push({
            id: lead.id,
            firstName: lead.firstName,
            lastName: lead.lastName,
            email: lead.email,
            score: score,
            communicationScore,
            createdAt: lead.createdAt
        });
    }

    // 3. Finalize Averages & Convert to Array
    const companies = Array.from(companyMap.values()).map(c => ({
        ...c,
        avgScore: c.leadCount > 0 ? c.avgScore / c.leadCount : 0,
        avgCommunicationScore: c.communicationLeadCount > 0 ? c.avgCommunicationScore / c.communicationLeadCount : 0
    })).sort((a, b) => b.lastSubmission.getTime() - a.lastSubmission.getTime());

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Companies</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Aggregated data by corporate domain. Public domains (Gmail, Yahoo, etc.) are excluded.
                    </p>
                </div>
                <div className="bg-blue-50 text-[#153749] px-4 py-2 rounded-lg text-sm font-medium">
                    {companies.length} Corporate Domains Found
                </div>
            </div>

            <CompaniesTable companies={companies} />
        </div>
    );
}
