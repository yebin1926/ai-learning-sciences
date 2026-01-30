"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

import guideData1 from "@/components/starting-guide1.json";
import guideData2 from "@/components/starting-guide2.json";
import guideData3 from "@/components/starting-guide3.json";

interface GuideOverlayProps {
    onComplete: () => void;
}

export default function GuideOverlay({ onComplete }: GuideOverlayProps) {
    const router = useRouter();
    const [step, setStep] = useState<number>(0);

    // Step 0: Consent (Guide 1)
    // Step 1: Survey (Guide 2)
    // Step 2: Learning Session Intro (Guide 3)

    const handleConsent = (agreed: boolean) => {
        if (agreed) {
            setStep(1); // Go to Survey
            window.scrollTo(0, 0);
        } else {
            router.push('/');
        }
    };

    const handleSurveyNext = () => {
        setStep(2); // Go to Guide 3
        window.scrollTo(0, 0);
    };

    const handleFinalNext = () => {
        onComplete(); // Go to Learn Session
    };

    // Shared container class for consistent width (approx 3/5 on large screens)
    const containerClass = "w-[95%] md:w-[80%] lg:w-[60%] bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]";

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <AnimatePresence mode="wait">

                {/* STEP 0: CONSENT */}
                {step === 0 && (
                    <motion.div
                        key="step0"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className={containerClass}
                    >
                        <div className="bg-slate-900 p-8 text-white">
                            <h1 className="text-2xl font-bold leading-tight">{guideData1.title}</h1>
                        </div>
                        <div className="p-8 overflow-y-auto space-y-8 flex-1">
                            {guideData1.sections.map((section, idx) => {
                                const isLast = idx === guideData1.sections.length - 1;
                                if (isLast) {
                                    return (
                                        <div key={idx} className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                                            <p className="text-lg font-bold text-slate-900 mb-6 text-center leading-relaxed">
                                                {section.text}
                                            </p>
                                            <div className="flex gap-4 justify-center">
                                                <button onClick={() => handleConsent(false)} className="px-8 py-3 rounded-xl border-2 border-slate-300 text-slate-600 font-bold hover:bg-slate-100 transition-colors">아니오 (No)</button>
                                                <button onClick={() => handleConsent(true)} className="px-8 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all">예 (Yes)</button>
                                            </div>
                                        </div>
                                    );
                                } else {
                                    return <p key={idx} className="text-slate-700 leading-relaxed whitespace-pre-line text-lg">{section.text}</p>;
                                }
                            })}
                        </div>
                    </motion.div>
                )}

                {/* STEP 1: SURVEY */}
                {step === 1 && (
                    <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className={containerClass}
                    >
                        <div className="bg-slate-900 p-6 text-white shrink-0">
                            <h1 className="text-2xl font-bold leading-tight">{guideData2.title}</h1>
                        </div>

                        <div className="flex-1 flex flex-col overflow-y-auto">
                            <div className="p-8 space-y-6">
                                {guideData2.sections.map((section, idx) => (
                                    <p key={idx} className="text-slate-700 leading-relaxed whitespace-pre-line text-lg">
                                        {section.text}
                                    </p>
                                ))}

                                {/* QUALTRICS IFRAME */}
                                <div className="w-full border-2 border-slate-100 rounded-2xl overflow-hidden bg-white">
                                    <iframe
                                        src="https://snuss1.qualtrics.com/jfe/form/SV_57RCKpqDGb6hpMq"
                                        className="w-full h-[600px] md:h-[500px]"
                                        frameBorder="0"
                                        title="Survey"
                                    ></iframe>
                                </div>
                            </div>
                        </div>

                        {/* Footer with NEXT Button */}
                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
                            <button
                                onClick={handleSurveyNext}
                                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 shadow-lg transition-transform active:scale-95"
                            >
                                Next <ArrowRight size={20} />
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* STEP 2: GUIDE 3 (New) */}
                {step === 2 && (
                    <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className={containerClass}
                    >
                        <div className="bg-slate-900 p-8 text-white">
                            <h1 className="text-2xl font-bold leading-tight">{guideData3.title}</h1>
                        </div>
                        <div className="p-8 overflow-y-auto space-y-8 flex-1">
                            {guideData3.sections.map((section, idx) => (
                                <p key={idx} className="text-slate-700 leading-relaxed whitespace-pre-line text-lg">
                                    {section.text}
                                </p>
                            ))}
                        </div>

                        {/* Footer with START Button */}
                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
                            <button
                                onClick={handleFinalNext}
                                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 shadow-lg transition-transform active:scale-95"
                            >
                                Start Learning <ArrowRight size={20} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
