"use client";

import { useState, Fragment } from "react";
import Link from "next/link";
import { Building, Users, Star, ArrowRight, ChevronDown, ChevronUp, Eye, MessageCircle } from "lucide-react";

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

export default function CompaniesTable({ companies }: { companies: CompanyStats[] }) {
    const [expandedDomain, setExpandedDomain] = useState<string | null>(null);

    const toggleExpand = (domain: string) => {
        if (expandedDomain === domain) {
            setExpandedDomain(null);
        } else {
            setExpandedDomain(domain);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-10"></th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Domain</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Employees</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Avg. Score</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Avg. Communication</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Last Activity</th>
                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {companies.length > 0 ? (
                        companies.map((company) => {
                            const isExpanded = expandedDomain === company.domain;
                            return (
                                <Fragment key={company.domain}>
                                    <tr
                                        className={`hover:bg-gray-50 transition-colors cursor-pointer ${isExpanded ? 'bg-blue-50/30' : ''}`}
                                        onClick={() => toggleExpand(company.domain)}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-400">
                                            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                                                    <Building size={20} />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-bold text-gray-900">{company.domain}</div>
                                                    {company.companyName !== company.domain && (
                                                        <div className="text-xs text-gray-500">{company.companyName}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center text-sm text-gray-700">
                                                <Users size={16} className="mr-2 text-gray-400" />
                                                {company.leadCount}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <span className="text-sm font-bold text-[#F05324]">{company.avgScore.toFixed(2)}</span>
                                                <Star size={14} className="ml-1 text-[#F05324] fill-[#F05324]" />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {company.communicationLeadCount > 0 ? (
                                                <div className="flex items-center">
                                                    <span className="text-sm font-bold text-[#049978]">{company.avgCommunicationScore.toFixed(2)}</span>
                                                    <MessageCircle size={14} className="ml-1 text-[#049978]" />
                                                </div>
                                            ) : (
                                                <span className="text-sm text-gray-300">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(company.lastSubmission).toISOString().split('T')[0]}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Link
                                                href={`/admin/companies/${company.domain}`}
                                                className="text-gec-orange hover:text-[#d0431b] flex items-center gap-1 ml-auto font-bold"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                Company Report <ArrowRight size={16} />
                                            </Link>
                                        </td>
                                    </tr>
                                    {isExpanded && (
                                        <tr className="bg-gray-50">
                                            <td colSpan={7} className="px-6 py-4">
                                                <div className="rounded-lg overflow-hidden border border-gray-200 bg-white">
                                                    <table className="min-w-full divide-y divide-gray-200">
                                                        <thead className="bg-gray-100">
                                                            <tr>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Employee Name</th>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Communication</th>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-200">
                                                            {company.leads.map((lead) => (
                                                                <tr key={lead.id} className="hover:bg-gray-50">
                                                                    <td className="px-4 py-2 text-sm font-medium text-gray-900">
                                                                        {lead.firstName} {lead.lastName}
                                                                    </td>
                                                                    <td className="px-4 py-2 text-sm text-gray-500">{lead.email}</td>
                                                                    <td className="px-4 py-2 text-sm font-bold text-[#F05324]">
                                                                        {lead.score.toFixed(2)}
                                                                    </td>
                                                                    <td className="px-4 py-2 text-sm font-bold text-[#049978]">
                                                                        {lead.communicationScore !== null ? lead.communicationScore.toFixed(2) : "—"}
                                                                    </td>
                                                                    <td className="px-4 py-2 text-sm text-gray-500">
                                                                        {new Date(lead.createdAt).toISOString().split('T')[0]}
                                                                    </td>
                                                                    <td className="px-4 py-2 text-right text-sm font-medium">
                                                                        <Link
                                                                            href={`/admin/leads/${lead.id}`}
                                                                            className="text-gray-400 hover:text-gec-orange transition-colors inline-block"
                                                                            title="View Individual Report"
                                                                        >
                                                                            <Eye size={16} />
                                                                        </Link>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>
                            );
                        })
                    ) : (
                        <tr>
                            <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                No corporate domains found. All current leads may be from public email providers.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
