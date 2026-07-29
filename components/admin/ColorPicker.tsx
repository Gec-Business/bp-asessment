"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

export const COLOR_OPTIONS = [
    { value: "red", label: "წითელი", hex: "#F05324" },
    { value: "yellow", label: "ყვითელი", hex: "#F0B91C" },
    { value: "green", label: "მწვანე", hex: "#049978" },
];

type ColorPickerProps = {
    value: string;
    onChange: (color: string) => void;
};

export default function ColorPicker({ value, onChange }: ColorPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const current = COLOR_OPTIONS.find(c => c.value === value);

    return (
        <div className="relative font-sans">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between border border-gray-300 rounded-lg px-3 py-2.5 w-full bg-white hover:bg-gray-50 hover:border-gec-orange transition-all shadow-sm group"
            >
                <div className="flex items-center gap-3">
                    <span
                        className="w-5 h-5 rounded-md border border-black/10 shrink-0"
                        style={{ backgroundColor: current?.hex || "#E5E7EB" }}
                    />
                    <span className={`text-sm font-medium ${current ? "text-gray-900" : "text-gray-500"}`}>
                        {current?.label || "აირჩიეთ ფერი..."}
                    </span>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gec-orange transition-colors" />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                    <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                        {COLOR_OPTIONS.map(opt => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                }}
                                className={`flex items-center gap-3 w-full px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors ${value === opt.value ? "bg-gray-50 font-semibold" : ""}`}
                            >
                                <span
                                    className="w-5 h-5 rounded-md border border-black/10 shrink-0"
                                    style={{ backgroundColor: opt.hex }}
                                />
                                <span className="text-gray-900">{opt.label}</span>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
