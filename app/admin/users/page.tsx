"use client";

import { useState, useEffect } from "react";
import { Trash2, UserPlus, ShieldAlert } from "lucide-react";

type User = {
    id: string;
    email: string;
    createdAt: string;
};

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [newUserEmail, setNewUserEmail] = useState("");
    const [newUserPassword, setNewUserPassword] = useState("");
    const [adding, setAdding] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch("/api/admin/users");
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setAdding(true);
        setError("");

        try {
            const res = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: newUserEmail, password: newUserPassword }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to create user");
            }

            setNewUserEmail("");
            setNewUserPassword("");
            fetchUsers();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setAdding(false);
        }
    };

    const handleDeleteUser = async (id: string, email: string) => {
        if (!confirm(`Are you sure you want to delete admin "${email}"? This action cannot be undone.`)) {
            return;
        }

        try {
            const res = await fetch(`/api/admin/users?id=${id}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                const data = await res.json();
                alert(data.error || "Failed to delete user");
                return;
            }

            fetchUsers();
        } catch (error) {
            alert("System error while deleting user");
        }
    };

    if (loading) return <div className="p-8 text-white">Loading users...</div>;

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <header className="flex justify-between items-center bg-white dark:bg-[#0B2533] p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Admin Users</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage access to the admin panel</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#F05324] bg-[#F05324]/10 px-4 py-2 rounded-lg">
                    <ShieldAlert size={18} />
                    <span>Super Admin Access</span>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* User List */}
                <div className="lg:col-span-2 bg-white dark:bg-[#0B2533] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="font-semibold text-gray-800 dark:text-white">Registered Admins</h2>
                    </div>
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {users.map((user) => (
                            <div key={user.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                <div>
                                    <p className="font-medium text-gray-800 dark:text-white">{user.email}</p>
                                    <p className="text-xs text-gray-500">Created: {new Date(user.createdAt).toLocaleDateString()}</p>
                                </div>
                                <button
                                    onClick={() => handleDeleteUser(user.id, user.email)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    title="Delete User"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                        {users.length === 0 && (
                            <div className="p-8 text-center text-gray-500">No users found.</div>
                        )}
                    </div>
                </div>

                {/* Add User Form */}
                <div className="bg-white dark:bg-[#0B2533] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-fit">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                            <UserPlus size={18} className="text-[#F05324]" />
                            Add New Admin
                        </h2>
                    </div>
                    <form onSubmit={handleAddUser} className="p-6 space-y-4">
                        {error && (
                            <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-200 dark:border-red-800">
                                {error}
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                            <input
                                type="email"
                                value={newUserEmail}
                                onChange={(e) => setNewUserEmail(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#F05324] focus:border-transparent outline-none"
                                placeholder="new@admin.com"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                            <input
                                type="password"
                                value={newUserPassword}
                                onChange={(e) => setNewUserPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#F05324] focus:border-transparent outline-none"
                                placeholder="********"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={adding}
                            className="w-full py-2 bg-[#F05324] hover:bg-[#d94a1f] text-white font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50"
                        >
                            {adding ? "Adding..." : "Create Admin"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
