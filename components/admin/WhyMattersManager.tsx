"use client";

import { useState, useEffect } from "react";
import * as Icons from "lucide-react";
import { useContentLocale, fieldKey } from "@/lib/i18n/ContentLocaleContext";

type WhyItem = {
    id: string;
    title: string;
    titleKa?: string | null;
    description: string;
    descriptionKa?: string | null;
    icon: string;
    order: number;
};

import IconPicker from "./IconPicker";

export default function WhyMattersManager() {
    const { contentLocale } = useContentLocale();
    const tf = (field: string) => fieldKey(field, contentLocale);
    const [items, setItems] = useState<WhyItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [newItem, setNewItem] = useState<any>({ title: "", titleKa: "", description: "", descriptionKa: "", icon: "Star", order: 1 });

    // Fetch Items
    const fetchItems = async () => {
        try {
            const res = await fetch("/api/admin/why-items");
            const data = await res.json();
            setItems(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    // Create Item
    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/admin/why-items", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newItem)
            });
            if (res.ok) {
                setNewItem({ title: "", titleKa: "", description: "", descriptionKa: "", icon: "Star", order: items.length + 1 });
                fetchItems();
            }
        } catch (error) {
            console.error(error);
        }
    };

    // Update Item
    const handleUpdate = async (id: string, updatedData: Partial<WhyItem>) => {
        try {
            const res = await fetch("/api/admin/why-items", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, ...updatedData })
            });
            if (res.ok) {
                fetchItems();
            }
        } catch (error) {
            console.error(error);
        }
    };

    // Delete Item
    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this item?")) return;
        try {
            const res = await fetch(`/api/admin/why-items?id=${id}`, {
                method: "DELETE"
            });
            if (res.ok) {
                fetchItems();
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="max-w-6xl mx-auto text-black">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Add New Why Item</h2>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Editing: {contentLocale === "ka" ? "Georgian" : "English"}</span>
            </div>

            {/* Create Form */}
            <div className="bg-gray-50 p-6 rounded-xl shadow-sm mb-12 border border-gray-200">
                <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                        <input
                            required
                            type="text"
                            value={newItem[tf('title')] || ""}
                            onChange={e => setNewItem({ ...newItem, [tf('title')]: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded text-black bg-white focus:ring-2 focus:ring-blue-500"
                            placeholder="Title"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                        <input
                            required
                            type="number"
                            value={newItem.order}
                            onChange={e => setNewItem({ ...newItem, order: parseInt(e.target.value) })}
                            className="w-full p-2 border border-gray-300 rounded text-black bg-white focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            required
                            value={newItem[tf('description')] || ""}
                            onChange={e => setNewItem({ ...newItem, [tf('description')]: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded text-black bg-white focus:ring-2 focus:ring-blue-500 h-24"
                            placeholder="Description"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Icon (Lucide Name)</label>
                        <IconPicker value={newItem.icon} onChange={icon => setNewItem({ ...newItem, icon })} />
                    </div>
                    <div className="md:col-span-2 flex justify-end">
                        <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-bold">
                            Add Item
                        </button>
                    </div>
                </form>
            </div>

            <h2 className="text-xl font-bold mb-6 text-gray-800">Existing Items</h2>

            {/* List Items */}
            <div className="grid grid-cols-1 gap-6">
                {items.map((item) => (
                    <div key={item.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-6 items-start">
                        {/* Icon Preview */}
                        <div className="flex-shrink-0">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                {(() => {
                                    const Icon = (Icons as any)[item.icon] || Icons.Circle;
                                    return <Icon size={32} />;
                                })()}
                            </div>
                        </div>

                        {/* Edit Form */}
                        <div className="flex-grow w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Title</label>
                                <input
                                    type="text"
                                    value={(item as any)[tf('title')] || ""}
                                    onChange={(e) => {
                                        const newItems = items.map(i => i.id === item.id ? { ...i, [tf('title')]: e.target.value } : i);
                                        setItems(newItems);
                                    }}
                                    className="w-full p-2 border border-gray-300 rounded text-black bg-white"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Order</label>
                                <input
                                    type="number"
                                    value={item.order}
                                    onChange={(e) => {
                                        const newItems = items.map(i => i.id === item.id ? { ...i, order: parseInt(e.target.value) } : i);
                                        setItems(newItems);
                                    }}
                                    className="w-full p-2 border border-gray-300 rounded text-black bg-white"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Description</label>
                                <textarea
                                    value={(item as any)[tf('description')] || ""}
                                    onChange={(e) => {
                                        const newItems = items.map(i => i.id === item.id ? { ...i, [tf('description')]: e.target.value } : i);
                                        setItems(newItems);
                                    }}
                                    className="w-full p-2 border border-gray-300 rounded text-black bg-white h-20"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Icon</label>
                                <IconPicker
                                    value={item.icon}
                                    onChange={(icon) => {
                                        const newItems = items.map(i => i.id === item.id ? { ...i, icon } : i);
                                        setItems(newItems);
                                    }}
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2 min-w-[100px]">
                            <button
                                onClick={() => handleUpdate(item.id, {
                                    title: item.title,
                                    titleKa: item.titleKa,
                                    description: item.description,
                                    descriptionKa: item.descriptionKa,
                                    order: item.order,
                                    icon: item.icon
                                })}
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
                            >
                                Save
                            </button>
                            <button
                                onClick={() => handleDelete(item.id)}
                                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 w-full"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
