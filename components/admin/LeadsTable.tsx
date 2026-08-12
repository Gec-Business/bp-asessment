"use client";

import { useEffect, useState } from "react";
import { Trash2, Download, CheckSquare, Square, Eye } from "lucide-react";

type Lead = {
    id: string;
    firstName: string;
    lastName: string;
    company: string | null;
    email: string;
    phone: string | null;
    employees: string | null;
    marketingConsent: boolean;
    createdAt: string;
    results: { score: number; phase: number }[];
};

export default function LeadsTable() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchLeads();
    }, []);

    const fetchLeads = async () => {
        try {
            const res = await fetch("/api/admin/leads");
            if (res.ok) {
                const data = await res.json();
                setLeads(data);
                setSelectedIds([]); // Clear selection on refresh
            }
        } catch (error) {
            console.error("Failed to fetch leads", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === leads.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(leads.map(l => l.id));
        }
    };

    const toggleSelect = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${selectedIds.length} lead(s)?`)) return;

        setActionLoading(true);
        try {
            const res = await fetch("/api/admin/leads/delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: selectedIds })
            });

            if (res.ok) {
                fetchLeads(); // Refresh list
            } else {
                alert("Failed to delete leads");
            }
        } catch (e) {
            console.error(e);
            alert("Error deleting leads");
        } finally {
            setActionLoading(false);
        }
    };

    const handleExport = async () => {
        setActionLoading(true);
        try {
            const res = await fetch("/api/admin/leads/export", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: selectedIds })
            });

            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `leads_export_${new Date().toISOString().split('T')[0]}.csv`; // It's CSV but opens in Excel
                document.body.appendChild(a);
                a.click();
                a.remove();
            } else {
                alert("Failed to export leads");
            }
        } catch (e) {
            console.error(e);
            alert("Error exporting leads");
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div>Loading leads...</div>;

    return (
        <div className="space-y-4">
            {/* Actions Bar */}
            <div className="flex justify-between items-center h-12">
                <div className="text-sm text-gray-500">
                    {selectedIds.length} selected
                </div>
                {selectedIds.length > 0 && (
                    <div className="flex gap-2">
                        <button
                            onClick={handleDelete}
                            disabled={actionLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                        >
                            <Trash2 size={16} />
                            Delete
                        </button>
                        <button
                            onClick={handleExport}
                            disabled={actionLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
                        >
                            <Download size={16} />
                            Export Excel
                        </button>
                    </div>
                )}
            </div>

            <div className="overflow-x-auto border rounded-xl shadow-sm">
                <table className="min-w-full bg-white divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 w-10">
                                <button onClick={toggleSelectAll} className="text-gray-500 hover:text-gec-orange">
                                    {selectedIds.length === leads.length && leads.length > 0 ? (
                                        <CheckSquare size={20} className="text-gec-orange" />
                                    ) : (
                                        <Square size={20} />
                                    )}
                                </button>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Full Name</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Company</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Employees</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Phone</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Marketing Consent</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Score</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Phase</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                        {leads.map((lead) => {
                            const isSelected = selectedIds.includes(lead.id);
                            return (
                                <tr key={lead.id} className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-orange-50/50' : ''}`}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button onClick={() => toggleSelect(lead.id)} className="text-gray-400 hover:text-gec-orange">
                                            {isSelected ? (
                                                <CheckSquare size={20} className="text-gec-orange" />
                                            ) : (
                                                <Square size={20} />
                                            )}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(lead.createdAt).toLocaleDateString("en-GB")}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {lead.firstName} {lead.lastName}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-700">
                                        {lead.company || "-"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {lead.employees || "-"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {lead.email}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {lead.phone || "-"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-medium">
                                        {lead.marketingConsent ? "Yes" : "No"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                        {lead.results[0]?.score.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-4">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                ${lead.results[0]?.phase === 1 ? 'bg-gray-100 text-gray-800' :
                                                    lead.results[0]?.phase === 2 ? 'bg-yellow-100 text-yellow-800' :
                                                        lead.results[0]?.phase === 3 ? 'bg-orange-100 text-orange-800' :
                                                            'bg-green-100 text-green-800'}`}>
                                                Phase {lead.results[0]?.phase}
                                            </span>

                                            <a
                                                href={`/admin/leads/${lead.id}`}
                                                className="text-gray-400 hover:text-gec-orange transition-colors p-1"
                                                title="View Report"
                                            >
                                                <Eye size={18} />
                                            </a>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
