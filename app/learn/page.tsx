"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle, ArrowLeft, RefreshCw, MessageCircle } from "lucide-react";
import Link from "next/link";
import Chatbot, { Message } from "@/components/Chatbot";

interface LearningContent {
    id: number;
    category: string;
    question: string;
    options: string[];
    answer: string;
    explanation: string;
    clue: string;
}

const learningContent: LearningContent[] = [
    {
        id: 1,
        category: "Vocabulary",
        question: "What does the word 'Serendipity' mean?",
        options: [
            "A tragedy",
            "Finding something good without looking for it",
            "A type of dance",
            "Being extremely sad"
        ],
        answer: "Finding something good without looking for it",
        explanation: "'Serendipity' is a happy accident or pleasant surprise! It was coined by Horace Walpole in 1754.",
        clue: "happy accident"
    },
    {
        id: 2,
        category: "Grammar",
        question: "Which sentence uses the correct 'Your/You're'?",
        options: [
            "Your going to be late.",
            "Is that you're cat?",
            "You're amazing!",
            "I like your smile."
        ],
        answer: "You're amazing!",
        explanation: "'You're' is a contraction for 'You are'. so 'You are amazing!' makes sense. 'Your' shows possession.",
        clue: "contraction"
    },
    {
        id: 3,
        category: "Literature",
        question: "In 'The Great Gatsby', who is Gatsby in love with?",
        options: ["Jordan Baker", "Daisy Buchanan", "Myrtle Wilson", "Nick Carraway"],
        answer: "Daisy Buchanan",
        explanation: "Jay Gatsby builds his entire fortune and persona to win back his former love, Daisy Buchanan.",
        clue: "green light"
    },
    {
        id: 4,
        category: "Idioms",
        question: "What does 'Break a leg' mean?",
        options: ["Get hurt", "Good luck", "Stop working", "Dance wildly"],
        answer: "Good luck",
        explanation: "It's a way to wish someone good luck, especially before a performance, to avoid 'jinxing' them.",
        clue: "performance superstition"
    },
    {
        id: 5,
        category: "Poetry",
        question: "What is a Haiku?",
        options: [
            "A 5-7-5 syllable poem",
            "A long epic story",
            "A poem that always rhymes",
            "A song about nature"
        ],
        answer: "A 5-7-5 syllable poem",
        explanation: "A Haiku is a Japanese poetic form consisting of three phrases with a 5, 7, 5 syllable structure.",
        clue: "syllable structure"
    }
];

export default function LearnPage() {
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState<boolean>(false);
    const [isCorrect, setIsCorrect] = useState<boolean>(false);
    const [attempts, setAttempts] = useState<number>(0);
    const [lessonComplete, setLessonComplete] = useState<boolean>(false);

    // Chatbot State
    const [chatMessages, setChatMessages] = useState<Message[]>([
        { id: "intro", role: "bot", text: "Hi! I'm here to help you reflect on your learning. Let's get started!" }
    ]);
    const [chatStep, setChatStep] = useState<"idle" | "reflection" | "feedback" | "completed">("idle");

    const currentQuestion = learningContent[currentIndex];
    const isLastQuestion = currentIndex === learningContent.length - 1;
    const maxAttempts = 3;

    // Trigger Chatbot logic when question is answered (correctly or max attempts reached)
    useEffect(() => {
        if (isAnswered) {
            const questionNumber = currentIndex + 1;
            const isOdd = questionNumber % 2 !== 0;

            // Slight delay for natural feel
            const timer = setTimeout(() => {
                if (isOdd) {
                    // Odd: Reflection
                    setChatMessages(prev => [
                        ...prev,
                        { id: `q${questionNumber}-reflection`, role: "bot", text: "What areas do you think you should work on next to improve your English?" }
                    ]);
                    setChatStep("reflection");
                } else {
                    // Even: Feedback
                    setChatMessages(prev => [
                        ...prev,
                        { id: `q${questionNumber}-feedback`, role: "bot", text: `Nice — you identified the key clue: "${currentQuestion.clue}". Now check the grammar rules again before locking in your answer next time.` }
                    ]);
                    setChatStep("feedback");
                }
            }, 1000);

            return () => clearTimeout(timer);
        }
    }, [isAnswered, currentIndex, currentQuestion.clue]);

    const handleOptionClick = (option: string) => {
        if (isAnswered) return;

        setSelectedOption(option);

        if (option === currentQuestion.answer) {
            setIsCorrect(true);
            setIsAnswered(true);
        } else {
            const newAttempts = attempts + 1;
            setAttempts(newAttempts);
            if (newAttempts >= maxAttempts) {
                setIsAnswered(true);
                setIsCorrect(false);
            }
        }
    };

    const handleNext = () => {
        if (isLastQuestion) {
            setLessonComplete(true);
        } else {
            setCurrentIndex((prev) => prev + 1);
            setSelectedOption(null);
            setIsAnswered(false);
            setIsCorrect(false);
            setAttempts(0);
            setChatStep("idle");
        }
    };

    const handleUserMessage = async (text: string) => {
        // User sent a reflection
        setChatMessages(prev => [...prev, { id: Date.now().toString(), role: "user", text }]);

        // Acknowledge and unblock
        setTimeout(() => {
            setChatMessages(prev => [...prev, { id: `ack-${Date.now()}`, role: "bot", text: "Thanks for sharing! That's a great insight." }]);
            setChatStep("completed");
        }, 1000);
    };

    const handleAcknowledgement = () => {
        setChatMessages(prev => [...prev, { id: `ack-btn-${Date.now()}`, role: "user", text: "Got it, thanks!" }]);
        setChatStep("completed");
    };

    if (lessonComplete) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="max-w-md rounded-3xl bg-white p-10 shadow-2xl"
                >
                    <div className="mb-6 flex justify-center">
                        <div className="rounded-full bg-green-100 p-4 text-green-600">
                            <CheckCircle size={64} />
                        </div>
                    </div>
                    <h1 className="mb-4 text-3xl font-bold text-slate-800">Lesson Complete!</h1>
                    <p className="mb-8 text-slate-600">You've learned 5 new things today. Great job!</p>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => {
                                setLessonComplete(false);
                                setCurrentIndex(0);
                                setSelectedOption(null);
                                setIsAnswered(false);
                                setIsCorrect(false);
                                setAttempts(0);
                                setChatStep("idle");
                                setChatMessages([{ id: "intro_reset", role: "bot", text: "Welcome back! Ready for another round?" }]);
                            }}
                            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                            <RefreshCw size={18} /> Review Again
                        </button>
                        <Link
                            href="/"
                            className="rounded-xl bg-slate-900 py-3 font-semibold text-white transition hover:bg-slate-800"
                        >
                            Back to Home
                        </Link>
                    </div>
                </motion.div>
            </div>
        );
    }

    // Calculate if Next button should be enabled
    const canProceed = isAnswered && chatStep === "completed";

    return (
        <div className="flex min-h-screen flex-col p-4 md:p-8 max-h-screen overflow-hidden">
            {/* Header - Compact */}
            <div className="flex items-center justify-between mb-4 px-2">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:bg-white/50 hover:text-slate-800"
                >
                    <ArrowLeft size={16} /> Home
                </Link>
                <div className="text-sm font-bold text-slate-400">
                    Question {currentIndex + 1} of {learningContent.length}
                </div>
            </div>

            {/* content Grid */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-0">

                {/* Left Column: Learning Content */}
                <div className="lg:col-span-2 flex flex-col h-full min-h-0 overflow-y-auto rounded-3xl bg-white p-6 shadow-xl ring-1 ring-black/5">
                    {/* Progress Bar */}
                    <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <motion.div
                            className="h-full bg-blue-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${((currentIndex + 1) / learningContent.length) * 100}%` }}
                            transition={{ duration: 0.5 }}
                        />
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentIndex}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex-1 flex flex-col"
                        >
                            <div className="mb-4 inline-block rounded-lg bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-500 w-fit">
                                {currentQuestion.category}
                            </div>

                            <h2 className="mb-6 text-2xl font-bold leading-snug text-slate-800">
                                {currentQuestion.question}
                            </h2>

                            <div className="space-y-3 mb-6">
                                {currentQuestion.options.map((option) => {
                                    let style = "w-full rounded-xl border-2 p-4 text-left font-medium transition-all duration-200 relative";
                                    const isSelected = option === selectedOption;

                                    if (isAnswered) {
                                        if (option === currentQuestion.answer) {
                                            style += " border-green-500 bg-green-50 text-green-700";
                                        } else if (isSelected && !isCorrect) {
                                            style += " border-red-400 bg-red-50 text-red-700";
                                        } else {
                                            style += " border-slate-100 text-slate-400 opacity-50";
                                        }
                                    } else {
                                        if (isSelected && option !== currentQuestion.answer) {
                                            style += " border-red-300 bg-white text-red-600 shake";
                                        } else {
                                            style += " border-slate-100 hover:border-blue-200 hover:bg-blue-50 text-slate-600 hover:text-blue-700";
                                        }
                                    }

                                    return (
                                        <button
                                            key={option}
                                            onClick={() => handleOptionClick(option)}
                                            disabled={isAnswered}
                                            className={style}
                                        >
                                            <div className="flex items-center justify-between">
                                                {option}
                                                {isAnswered && option === currentQuestion.answer && (
                                                    <CheckCircle size={20} className="text-green-500" />
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Attempts Indicator */}
                            {!isAnswered && attempts > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={attempts}
                                    className="mt-4 text-center text-sm font-medium text-orange-500"
                                >
                                    Incorrect. You have {maxAttempts - attempts} attempts remaining.
                                </motion.div>
                            )}

                            {/* Explanation / Feedback */}
                            <AnimatePresence>
                                {isAnswered && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="border-t border-slate-100 pt-6">
                                            <div className={`mb-2 flex items-center gap-2 font-bold ${isCorrect ? 'text-green-600' : 'text-red-500'}`}>
                                                {isCorrect ? 'Correct!' : 'Out of attempts!'}
                                            </div>
                                            <p className="text-base leading-relaxed text-slate-600">
                                                {currentQuestion.explanation}
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation */}
                    <div className="mt-auto pt-6 flex justify-end">
                        <button
                            onClick={handleNext}
                            disabled={!canProceed}
                            className="group flex items-center gap-2 rounded-2xl bg-slate-900 px-8 py-4 text-lg font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                        >
                            {isLastQuestion ? "Finish Lesson" : "Next Question"}
                            <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
                        </button>
                    </div>
                </div>

                {/* Right Column: Chatbot */}
                <div className="lg:col-span-1 h-[500px] lg:h-full min-h-0">
                    <Chatbot
                        messages={chatMessages}
                        onSendMessage={handleUserMessage}
                        inputEnabled={chatStep === "reflection"}
                        actionNode={chatStep === "feedback" ? (
                            <button
                                onClick={handleAcknowledgement}
                                className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white shadow-md hover:bg-indigo-700 active:scale-95 transition-all"
                            >
                                Got it, I've checked!
                            </button>
                        ) : undefined}
                        className="h-full"
                    />
                </div>
            </div>
        </div>
    );
}
