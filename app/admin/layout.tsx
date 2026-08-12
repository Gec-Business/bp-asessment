"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Users, Settings, LogOut, LayoutDashboard, FileText, HelpCircle, ShieldAlert, Building, Eye } from "lucide-react";
import { ContentLocaleProvider, useContentLocale } from "@/lib/i18n/ContentLocaleContext";

function ContentLocaleToggle() {
    const { contentLocale, setContentLocale } = useContentLocale();
    return (
        <div className="px-4 pb-4">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Editing content in</p>
            <div className="flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-700 p-1 text-sm font-semibold">
                <button
                    type="button"
                    onClick={() => setContentLocale("en")}
                    className={`flex-1 px-3 py-1.5 rounded-md transition-colors ${contentLocale === "en" ? "bg-[#F05324] text-white" : "text-gray-500 hover:text-gray-900 dark:hover:text-white"}`}
                >
                    English
                </button>
                <button
                    type="button"
                    onClick={() => setContentLocale("ka")}
                    className={`flex-1 px-3 py-1.5 rounded-md transition-colors ${contentLocale === "ka" ? "bg-[#F05324] text-white" : "text-gray-500 hover:text-gray-900 dark:hover:text-white"}`}
                >
                    Georgian
                </button>
            </div>
        </div>
    );
}

function AdminLayoutInner({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    const navItems = [
        { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
        { name: "Questions", href: "/admin/questions", icon: HelpCircle },
        { name: "Phases", href: "/admin/phases", icon: FileText },
        { name: "Landing Steps", href: "/admin/landing-steps", icon: LayoutDashboard },
        { name: "Global Settings", href: "/admin/global-settings", icon: Settings },
        { name: "Companies", href: "/admin/companies", icon: Building },
        { name: "Preview Report", href: "/admin/preview", icon: Eye },
        { name: "Why Matters", href: "/admin/why-matters", icon: HelpCircle },
        { name: "Leads", href: "/admin/leads", icon: Users },
        { name: "Admin Users", href: "/admin/users", icon: ShieldAlert },
    ];

    return (
        <div className="flex h-screen bg-[#F3F4F6] dark:bg-[#153749]">
            {/* Sidebar */}
            <aside className="w-64 bg-white dark:bg-[#0B2533] shadow-xl flex flex-col">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h1 className="text-2xl font-bold text-[#F05324]">GEC Admin</h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Management Portal</p>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive
                                    ? "bg-[#F05324]/10 text-[#F05324]"
                                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                                    }`}
                            >
                                <item.icon size={20} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <ContentLocaleToggle />

                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                        <LogOut size={20} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto p-8">
                {children}
            </main>
        </div>
    );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <ContentLocaleProvider>
            <AdminLayoutInner>{children}</AdminLayoutInner>
        </ContentLocaleProvider>
    );
}
