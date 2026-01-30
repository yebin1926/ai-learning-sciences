"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, ArrowLeft, Clock, AlertCircle, ArrowRight, Home } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Data Imports
import testStartGuide from "@/components/test-starting-guide.json";
import testEndGuide from "@/components/test-ending-guide.json";

type TestStage = 'intro' | 'test' | 'outro';

export default function TestPage() {
    const router = useRouter();

    // Stage Management
    const [stage, setStage] = useState<TestStage>('intro');

    // Test State
    const [essayAnswer, setEssayAnswer] = useState<string>("");
    const [submitted, setSubmitted] = useState<boolean>(false);

    // UX State (Alerts)
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [alertType, setAlertType] = useState<'error' | 'warning'>('error');

    // Timer State (60s = 1m) [TESTING]
    const [timeLeft, setTimeLeft] = useState<number>(60);

    // --- Helpers ---
    const showAlert = (msg: string, type: 'error' | 'warning' = 'error') => {
        setAlertMessage(msg);
        setAlertType(type);
        setTimeout(() => setAlertMessage(null), 3000);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // --- Effects (Timer - Only runs in 'test' stage) ---
    useEffect(() => {
        if (stage !== 'test' || submitted) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [stage, submitted]);

    useEffect(() => {
        if (stage !== 'test') return;

        if (timeLeft === 30) {
            showAlert("30 seconds left!", 'warning');
        } else if (timeLeft === 10) {
            showAlert("10 seconds left!", 'warning');
        } else if (timeLeft === 0 && !submitted) {
            // TIME OVER -> Force Submit & End
            handleSubmit();
            setStage('outro');
        }
    }, [timeLeft, submitted, stage]);


    // --- Handlers ---

    const handleSubmit = () => {
        if (submitted) return;
        setSubmitted(true);
        // Save the essay answer if needed (not implemented yet, just flow)
        setStage('outro');
    };

    // --- RENDERING ---

    // 1. INTRO GUIDE
    if (stage === 'intro') {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-[95%] md:w-[80%] lg:w-[60%] bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    <div className="bg-slate-900 p-8 text-white">
                        <h1 className="text-2xl font-bold leading-tight">{testStartGuide.title}</h1>
                    </div>
                    <div className="p-8 overflow-y-auto space-y-8 flex-1">
                        {testStartGuide.sections.map((section, idx) => (
                            <p key={idx} className="text-slate-700 leading-relaxed whitespace-pre-line text-lg">
                                {section.text}
                            </p>
                        ))}
                    </div>
                    <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between shrink-0">
                        <Link href="/" className="px-6 py-3 rounded-xl border-2 border-slate-300 text-slate-600 font-bold hover:bg-slate-100 transition-colors flex items-center gap-2">
                            <ArrowLeft size={20} /> Back
                        </Link>
                        <button
                            onClick={() => setStage('test')}
                            className="px-8 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                        >
                            Next <ArrowRight size={20} />
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    // 3. OUTRO GUIDE
    if (stage === 'outro') {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-[95%] md:w-[80%] lg:w-[60%] bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    <div className="bg-slate-900 p-8 text-white">
                        <h1 className="text-2xl font-bold leading-tight">{testEndGuide.title}</h1>
                    </div>
                    <div className="p-8 overflow-y-auto space-y-8 flex-1">
                        {testEndGuide.sections.map((section, idx) => (
                            <p key={idx} className="text-slate-700 leading-relaxed whitespace-pre-line text-lg">
                                {section.text}
                            </p>
                        ))}
                    </div>
                    <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
                        <Link href="/" className="px-8 py-3 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 shadow-lg hover:shadow-xl transition-all flex items-center gap-2">
                            Go Home <Home size={20} />
                        </Link>
                    </div>
                </motion.div>
            </div>
        );
    }

    // 2. TEST SESSION (Default)
    return (
        <div className="min-h-screen p-6 pb-20 md:p-12 relative">
            {/* ALERT TOAST */}
            <AnimatePresence>
                {alertMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -50, x: "-50%" }}
                        animate={{ opacity: 1, y: 0, x: "-50%" }}
                        exit={{ opacity: 0, y: -20, x: "-50%" }}
                        className={`fixed top-10 left-1/2 z-50 flex items-center gap-2 rounded-full px-6 py-3 text-white shadow-xl ${alertType === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                    >
                        <AlertCircle size={20} />
                        <span className="font-medium">{alertMessage}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex items-center justify-between mb-8">
                <div className="text-sm font-bold text-slate-400">Assessment</div>

                {/* Timer Badge */}
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full font-bold text-sm ${timeLeft <= 30 ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                    <Clock size={16} />
                    <span>{formatTime(timeLeft)}</span>
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-auto max-w-4xl"
            >
                <div className="mb-10 text-center">
                    <h1 className="text-4xl font-bold text-slate-800">Knowledge Check</h1>
                </div>

                <div className="overflow-hidden rounded-2xl border border-white/40 bg-white/60 p-8 shadow-sm backdrop-blur-md">
                    <h3 className="mb-6 text-xl font-semibold text-slate-800">
                        이전 지문이 어떤 내용이었는지 최대한 기억나는 만큼 작성해주세요 (임시 질문).
                    </h3>

                    <textarea
                        className="w-full h-96 p-6 rounded-xl border-2 border-slate-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all outline-none resize-none text-lg text-slate-800"
                        style={{ fontFamily: '"Cambria Math", serif', lineHeight: '1.5' }}
                        placeholder="이곳에 답변을 작성해주세요..."
                        value={essayAnswer}
                        onChange={(e) => setEssayAnswer(e.target.value)}
                        disabled={submitted}
                    />
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-10 flex justify-center"
                >
                    <button
                        onClick={handleSubmit}
                        disabled={essayAnswer.trim().length === 0}
                        className="rounded-2xl bg-slate-900 px-10 py-4 text-lg font-bold text-white shadow-xl transition-transform hover:scale-105 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Submit Answer
                    </button>
                </motion.div>
            </motion.div>
        </div>
    );
}
