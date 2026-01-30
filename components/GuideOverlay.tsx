"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import guideData from "@/components/starting-guide1.json";

interface GuideOverlayProps {
    onComplete: () => void;
}

export default function GuideOverlay({ onComplete }: GuideOverlayProps) {
    const router = useRouter();

    const handleGuideConsent = (agreed: boolean) => {
        if (agreed) {
            onComplete();
        } else {
            router.push('/');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl w-full bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="bg-slate-900 p-8 text-white">
                    <h1 className="text-2xl font-bold leading-tight">{guideData.title}</h1>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto space-y-8 flex-1">
                    {guideData.sections.map((section, idx) => {
                        const isLast = idx === guideData.sections.length - 1;

                        if (isLast) {
                            // Consent Question Block
                            return (
                                <div key={idx} className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                                    <p className="text-lg font-bold text-slate-900 mb-6 text-center leading-relaxed">
                                        {section.text}
                                    </p>
                                    <div className="flex gap-4 justify-center">
                                        <button
                                            onClick={() => handleGuideConsent(false)}
                                            className="px-8 py-3 rounded-xl border-2 border-slate-300 text-slate-600 font-bold hover:bg-slate-100 transition-colors"
                                        >
                                            아니오 (No)
                                        </button>
                                        <button
                                            onClick={() => handleGuideConsent(true)}
                                            className="px-8 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all"
                                        >
                                            예 (Yes)
                                        </button>
                                    </div>
                                </div>
                            );
                        } else {
                            // Normal Text Block
                            return (
                                <p key={idx} className="text-slate-700 leading-relaxed whitespace-pre-line text-lg">
                                    {section.text}
                                </p>
                            );
                        }
                    })}
                </div>
            </motion.div>
        </div>
    );
}
