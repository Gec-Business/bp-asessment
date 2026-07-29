import { formatDistanceToNow } from 'date-fns';
import { ka } from 'date-fns/locale';

type RecentLead = {
    id: string;
    firstName: string;
    lastName: string;
    company: string | null;
    createdAt: Date;
    score: number | null;
    phaseName: string | null;
};

export default function RecentActivity({ leads }: { leads: RecentLead[] }) {
    if (!leads || leads.length === 0) {
        return <div className="text-gray-500 text-sm">No recent activity</div>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 decoration-slate-400">
                    <tr>
                        <th className="px-4 py-3 font-semibold">User</th>
                        <th className="px-4 py-3 font-semibold">Company</th>
                        <th className="px-4 py-3 font-semibold">Score</th>
                        <th className="px-4 py-3 font-semibold">Phase</th>
                        <th className="px-4 py-3 font-semibold">Time</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 border-t border-gray-100">
                    {leads.map((lead) => (
                        <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 font-medium text-gray-900">
                                {lead.firstName} {lead.lastName}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                                {lead.company || "-"}
                            </td>
                            <td className="px-4 py-3">
                                {lead.score ? (
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                                        ${lead.score >= 4 ? 'bg-green-100 text-green-800' :
                                            lead.score >= 3 ? 'bg-blue-100 text-blue-800' :
                                                'bg-amber-100 text-amber-800'}`}>
                                        {lead.score.toFixed(2)}
                                    </span>
                                ) : (
                                    <span className="text-gray-400">-</span>
                                )}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                                {lead.phaseName || "-"}
                            </td>
                            <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                                {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
