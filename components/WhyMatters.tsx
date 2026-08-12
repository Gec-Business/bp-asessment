import React from 'react';
import * as Icons from 'lucide-react';

const WhyMatters = ({ items, title }: { items: any[], title?: string }) => {
    return (
        <section className="py-12 relative z-10 w-full">
            <div className="max-w-6xl mx-auto px-4">
                <h2 className="text-3xl font-bold text-center text-white mb-12">
                    {title || "Why does this matter?"}
                </h2>
                <div className="flex flex-wrap justify-center gap-6">
                    {items.map((item) => {
                        const Icon = (Icons as any)[item.icon] || Icons.Circle;
                        return (
                            <div key={item.id} className="w-full md:w-[calc(33.333%-1rem)] p-6 md:p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl relative overflow-hidden">
                                <div className="w-14 h-14 rounded-full bg-[#F05324]/10 border border-[#F05324]/20 flex items-center justify-center mb-6 text-[#F05324] relative">
                                    <div className="absolute inset-0 bg-[#F05324] blur-xl opacity-20"></div>
                                    <Icon size={28} className="relative z-10" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                                <p className="text-gray-300 leading-relaxed text-sm">{item.description}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};
export default WhyMatters;
