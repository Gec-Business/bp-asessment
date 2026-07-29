import { useState, useEffect } from 'react';
import { Trash2, Plus, GripVertical } from 'lucide-react';
import IconPicker from './IconPicker';
import ColorPicker from './ColorPicker';

type FieldDef = {
    name: string;
    label: string;
    type: 'text' | 'textarea' | 'icon' | 'color';
    placeholder?: string;
};

type BlockListEditorProps = {
    value: string; // Expecting JSON string
    onChange: (newValue: string) => void;
    fields: FieldDef[];
    label: string;
};

export default function BlockListEditor({ value, onChange, fields, label }: BlockListEditorProps) {
    const [items, setItems] = useState<any[]>([]);

    useEffect(() => {
        try {
            const parsed = JSON.parse(value || "[]");
            if (Array.isArray(parsed)) {
                setItems(parsed);
            } else {
                setItems([]);
            }
        } catch (e) {
            console.error("Failed to parse block list value", e);
            setItems([]);
        }
    }, [value]);

    const updateItem = (index: number, fieldName: string, fieldValue: string) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [fieldName]: fieldValue };
        setItems(newItems);
        onChange(JSON.stringify(newItems));
    };

    const addItem = () => {
        const newItem: any = {};
        fields.forEach(f => newItem[f.name] = "");
        const newItems = [...items, newItem];
        setItems(newItems);
        onChange(JSON.stringify(newItems));
    };

    const removeItem = (index: number) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
        onChange(JSON.stringify(newItems));
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">{label}</label>
                <button
                    type="button"
                    onClick={addItem}
                    className="flex items-center gap-1 text-sm text-white bg-gec-teal hover:bg-teal-700 px-3 py-1.5 rounded-md transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" /> Add Item
                </button>
            </div>

            <div className="space-y-3">
                {items.map((item, index) => (
                    <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4 relative group hover:border-gec-orange/30 transition-all">
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => removeItem(index)}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-md"
                                title="Delete Item"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                            {/* Handle Icon for Drag (Visual only for now) */}
                            <div className="hidden md:flex flex-col justify-center items-center col-span-1 text-gray-300">
                                <GripVertical className="w-5 h-5" />
                                <span className="text-xs">{index + 1}</span>
                            </div>

                            <div className="col-span-11 grid grid-cols-1 gap-4">
                                {fields.map((field) => (
                                    <div key={field.name} className={field.type === 'textarea' ? 'col-span-full' : ''}>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                            {field.label}
                                        </label>

                                        {field.type === 'icon' ? (
                                            <IconPicker
                                                value={item[field.name]}
                                                onChange={(val) => updateItem(index, field.name, val)}
                                            />
                                        ) : field.type === 'color' ? (
                                            <ColorPicker
                                                value={item[field.name]}
                                                onChange={(val) => updateItem(index, field.name, val)}
                                            />
                                        ) : field.type === 'textarea' ? (
                                            <textarea
                                                value={item[field.name] || ""}
                                                onChange={(e) => updateItem(index, field.name, e.target.value)}
                                                className="w-full border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-gec-orange focus:border-gec-orange text-gray-900 bg-white"
                                                rows={3}
                                                placeholder={field.placeholder}
                                            />
                                        ) : (
                                            <input
                                                type="text"
                                                value={item[field.name] || ""}
                                                onChange={(e) => updateItem(index, field.name, e.target.value)}
                                                className="w-full border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-gec-orange focus:border-gec-orange text-gray-900 bg-white"
                                                placeholder={field.placeholder}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}

                {items.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg text-gray-400">
                        No items yet. Click &quot;Add Item&quot; to start.
                    </div>
                )}
            </div>
        </div>
    );
}
