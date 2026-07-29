import { prisma } from "@/lib/prisma";
import { Users, FileText, CheckCircle, BarChart2, Activity } from "lucide-react";
import PhaseDistributionChart from "@/components/admin/dashboard/PhaseDistributionChart";
import RecentActivity from "@/components/admin/dashboard/RecentActivity";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
    // 1. Fetch Counts
    const leadsCount = await prisma.lead.count();
    const usersCount = await prisma.user.count();
    const resultsCount = await prisma.result.count();

    // 2. Fetch Recent Leads with Results (Last 5)
    // We want the score and phase, so we include results.
    // Assuming one result per lead for simplicity or taking the latest result.
    // Since Result links to Lead, we can query Leads and include Results.
    const recentLeads = await prisma.lead.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
            results: {
                take: 1,
                orderBy: { createdAt: 'desc' }
            }
        }
    });

    // We also need phase names to display.
    const phases = await prisma.phase.findMany();
    const phaseMap = new Map(phases.map(p => [p.id, p]));

    const activityData = recentLeads.map(lead => {
        const result = lead.results[0];
        const phase = result ? phaseMap.get(result.phase) : null;
        return {
            id: lead.id,
            firstName: lead.firstName,
            lastName: lead.lastName,
            company: lead.company,
            createdAt: lead.createdAt,
            score: result?.score || null,
            phaseName: phase?.title || null
        };
    });

    // 3. Fetch Phase Distribution for Charts
    // We group results by phase.
    const resultsDistribution = await prisma.result.groupBy({
        by: ['phase'],
        _count: {
            phase: true
        }
    });

    const chartData = resultsDistribution.map(item => {
        const phase = phaseMap.get(item.phase);
        return {
            name: phase?.title || `Phase ${item.phase}`,
            count: item._count.phase,
            color: phase?.color || "#CCCCCC"
        };
    });


    const stats = [
        { name: "Total Leads", value: leadsCount, icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
        { name: "Completed Assessments", value: resultsCount, icon: CheckCircle, color: "text-green-600", bg: "bg-green-100" },
        { name: "Admin Users", value: usersCount, icon: FileText, color: "text-purple-600", bg: "bg-purple-100" },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
                    <p className="text-gray-500">Welcome to the GEC Assessment Admin Panel</p>
                </div>
                <div className="text-sm text-gray-400">
                    Last updated: {new Date().toLocaleTimeString()}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat) => (
                    <div key={stat.name} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className={`p-3 rounded-lg ${stat.bg}`}>
                            <stat.icon className={`w-8 h-8 ${stat.color}`} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">{stat.name}</p>
                            <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Phase Distribution Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-6">
                        <BarChart2 className="w-5 h-5 text-gec-orange" />
                        <h2 className="text-lg font-bold text-gray-800">Assessment Results by Phase</h2>
                    </div>
                    <PhaseDistributionChart data={chartData} />
                </div>

                {/* Recent Activity */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-6">
                        <Activity className="w-5 h-5 text-blue-600" />
                        <h2 className="text-lg font-bold text-gray-800">Recent Activity</h2>
                    </div>
                    <RecentActivity leads={activityData} />
                    <div className="mt-4 pt-4 border-t border-gray-50 text-center">
                        <Link href="/admin/leads" className="text-sm text-blue-600 font-medium hover:underline">
                            View All Leads
                        </Link>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Link href="/admin/leads" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
                        <Users className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                        <span className="text-sm font-medium text-gray-700">Manage Leads</span>
                    </Link>
                    <Link href="/admin/global-settings" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
                        <FileText className="w-6 h-6 mx-auto mb-2 text-orange-600" />
                        <span className="text-sm font-medium text-gray-700">Global Settings</span>
                    </Link>
                    <Link href="/admin/phases" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
                        <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-600" />
                        <span className="text-sm font-medium text-gray-700">Edit Phases</span>
                    </Link>
                    <Link href="/admin/questions" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
                        <BarChart2 className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                        <span className="text-sm font-medium text-gray-700">Edit Questions</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}

