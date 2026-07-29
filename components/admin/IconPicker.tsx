import { useState, useMemo } from 'react';
import * as rxIcons from 'lucide-react';
import { X, Search, ChevronDown } from 'lucide-react';

// Filter out non-component exports if necessary.
// We'll filter for keys that start with Uppercase (conventional for components) 
// and exclude `createLucideIcon`.
const loadedIcons = Object.keys(rxIcons)
    .filter(key => key !== "createLucideIcon" && key !== "default" && /^[A-Z]/.test(key))
    .sort();

type IconPickerProps = {
    value: string;
    onChange: (iconName: string) => void;
};

export default function IconPicker({ value, onChange }: IconPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");

    // Filter icons based on search
    const filteredIcons = useMemo(() => {
        if (!search) return loadedIcons;
        return loadedIcons.filter(name => name.toLowerCase().includes(search.toLowerCase()));
    }, [search]);

    // Render current icon if it exists
    const CurrentIcon = (rxIcons as any)[value];

    return (
        <div className="relative font-sans">
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="flex items-center justify-between border border-gray-300 rounded-lg px-3 py-2.5 w-full bg-white hover:bg-gray-50 hover:border-gec-orange transition-all shadow-sm group"
            >
                <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-md ${CurrentIcon ? 'bg-orange-100 text-gec-orange' : 'bg-gray-100 text-gray-400'}`}>
                        {CurrentIcon ? (
                            <CurrentIcon className="w-5 h-5" />
                        ) : (
                            <div className="w-5 h-5 border-2 border-dashed border-current rounded-sm" />
                        )}
                    </div>
                    <span className={`text-sm font-medium ${value ? 'text-gray-900' : 'text-gray-500'}`}>
                        {value || "Select Icon..."}
                    </span>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gec-orange transition-colors" />
            </button>

            {/* Modal / Popover */}
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                        {/* Header */}
                        <div className="p-5 border-b flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="font-bold text-xl text-gec-navy">Select Icon</h3>
                                <p className="text-xs text-gray-500 mt-0.5">{loadedIcons.length} icons available</p>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500 hover:text-red-500"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Search */}
                        <div className="p-4 border-b bg-white relative z-10 sticky top-0">
                            <div className="relative">
                                <Search className="absolute left-3.5 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="Search icons (e.g. arrow, user, chart)..."
                                    className="w-full border border-gray-300 rounded-lg pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-gec-orange focus:border-gec-orange outline-none text-gray-900 placeholder:text-gray-400 shadow-sm transition-shadow"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Grid */}
                        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
                            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-9 gap-3">
                                {filteredIcons.slice(0, 300).map((name) => {
                                    const Icon = (rxIcons as any)[name];
                                    const isSelected = value === name;
                                    return (
                                        <button
                                            key={name}
                                            onClick={() => {
                                                onChange(name);
                                                setIsOpen(false);
                                            }}
                                            className={`
                                                group flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 border
                                                ${isSelected
                                                    ? 'bg-gec-orange text-white border-gec-orange shadow-md scale-105 ring-2 ring-offset-2 ring-gec-orange'
                                                    : 'bg-white text-gray-600 border-gray-200 hover:border-gec-orange hover:shadow-lg hover:-translate-y-1'
                                                }
                                            `}
                                            title={name}
                                        >
                                            <Icon className={`w-7 h-7 mb-2 transition-transform ${isSelected ? 'scale-110' : 'group-hover:scale-110'}`} />
                                            <span className={`text-[10px] truncate w-full text-center font-medium ${isSelected ? 'text-white' : 'text-gray-500 group-hover:text-gec-orange'}`}>
                                                {name}
                                            </span>
                                        </button>
                                    )
                                })}
                            </div>

                            {filteredIcons.length === 0 && (
                                <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                                    <Search className="w-12 h-12 mb-4 opacity-20" />
                                    <p className="text-lg font-medium">No icons found</p>
                                    <p className="text-sm">Try a different search term</p>
                                </div>
                            )}

                            {filteredIcons.length > 300 && (
                                <div className="mt-8 text-center">
                                    <span className="inline-block px-4 py-1.5 bg-gray-100 text-gray-500 rounded-full text-xs font-medium">
                                        Showing top 300 matches... Refine search to see more.
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
