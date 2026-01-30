"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, ArrowLeft, Clock, AlertCircle, ArrowRight, Home } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Data Imports
import testStartGuide from "@/components/test-starting-guide.json";
import testEndGuide from "@/components/test-ending-guide.json";

interface Question {
    id: number;
    question: string;
    options: string[];
    answer: string;
}

const questions: Question[] = [
    {
        id: 1,
        question: "Which of these is a synonym for 'Happy'?",
        options: ["Sad", "Joyful", "Angry", "Tired"],
        answer: "Joyful",
    },
    {
        id: 2,
        question: "Identify the noun in the sentence: 'The cat sleeps.'",
        options: ["The", "Cat", "Sleeps", "Deeply"],
        answer: "Cat",
    },
    {
        id: 3,
        question: "Who wrote 'Romeo and Juliet'?",
        options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
        answer: "William Shakespeare",
    },
    {
        id: 4,
        question: "What is the past tense of 'Run'?",
        options: ["Running", "Ran", "Runned", "Runs"],
        answer: "Ran",
    },
    {
        id: 5,
        question: "Complete the proverb: 'Better late than...'",
        options: ["Early", "Never", "Ever", "Now"],
        answer: "Never",
    },
];

interface SelectedAnswers {
    [key: number]: string;
}

type TestStage = 'intro' | 'test' | 'outro';

export default function TestPage() {
    const router = useRouter();

    // Stage Management
    const [stage, setStage] = useState<TestStage>('intro');

    // Test State
    const [selectedAnswers, setSelectedAnswers] = useState<SelectedAnswers>({});
    const [submitted, setSubmitted] = useState<boolean>(false);
    const [score, setScore] = useState<number>(0);

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
    const handleOptionSelect = (questionId: number, option: string) => {
        if (submitted) return;
        setSelectedAnswers((prev) => ({ ...prev, [questionId]: option }));
    };

    const handleSubmit = () => {
        if (submitted) return;

        let currentScore = 0;
        questions.forEach((q) => {
            if (selectedAnswers[q.id] === q.answer) {
                currentScore++;
            }
        });
        setScore(currentScore);
        setSubmitted(true);
        // We do NOT immediately change stage here? Or maybe we do. 
        // User request: "After the user is finished ... redirect users to a new page with contents of test-ending-guide".
        // So hitting submit should probably show the result briefly OR go straight to End guide.
        // Usually, in tests, seeing the score IS the end. 
        // But the requirements say "redirect users to a new page... ending-guide".
        // So I will redirect to 'outro' immediately after submit? 
        // Or maybe let them see the score, then click "Finish"?
        // Typically "finished" means they are done. 
        // Let's make it so Submit -> Transitions to Outro. 
        // BUT, showing the score/feedback is valuable.
        // I'll show the score view, but replace the "Go Home" button there with "Finish Test" -> Outro.

        // Actually, the request says "After the user is finished... redirect users to a new page".
        // Use the existing "knowledge check result" view for feedback?
        // Let's transition to 'outro' when they click "Next" or "Finish" from the result view.
        // WAIT: The prompt implies the OUTRO PAGE is the destination. 
        // So I will change the "Submit" action to go to 'outro' OR show a score summary which leads to 'outro'.

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
                {/* Intro Back Button (disabled during test usually, but keeping it for safety?) */}
                {/* Actually user cannot go back to Intro easily. */}
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
                className="mx-auto max-w-3xl"
            >
                <div className="mb-10 text-center">
                    <h1 className="text-4xl font-bold text-slate-800">Knowledge Check</h1>
                    <p className="mt-2 text-slate-600">
                        {/* Removing Score display here as per new flow? Or keep it? */}
                        Answer the 5 questions below.
                    </p>
                </div>

                <div className="space-y-6">
                    {questions.map((q, index) => (
                        <motion.div
                            key={q.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="overflow-hidden rounded-2xl border border-white/40 bg-white/60 p-6 shadow-sm backdrop-blur-md"
                        >
                            <h3 className="mb-4 text-xl font-semibold text-slate-800">
                                <span className="mr-2 text-slate-400">#{index + 1}</span>
                                {q.question}
                            </h3>

                            <div className="grid gap-3 sm:grid-cols-2">
                                {q.options.map((option) => {
                                    const isSelected = selectedAnswers[q.id] === option;

                                    let buttonStyle = "relative flex items-center justify-between rounded-xl border p-4 text-left font-medium transition-all hover:shadow-md";

                                    if (isSelected) {
                                        buttonStyle += " border-blue-400/50 bg-blue-100 text-blue-900 shadow-sm";
                                    } else {
                                        buttonStyle += " border-slate-200 bg-white/40 text-slate-700 hover:border-blue-300 hover:bg-blue-50";
                                    }

                                    return (
                                        <button
                                            key={option}
                                            onClick={() => handleOptionSelect(q.id, option)}
                                            className={buttonStyle}
                                        >
                                            <span>{option}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-10 flex justify-center"
                >
                    <button
                        onClick={handleSubmit}
                        disabled={Object.keys(selectedAnswers).length < questions.length}
                        className="rounded-2xl bg-slate-900 px-10 py-4 text-lg font-bold text-white shadow-xl transition-transform hover:scale-105 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Submit Answers
                    </button>
                </motion.div>
            </motion.div>
        </div>
    );
}
