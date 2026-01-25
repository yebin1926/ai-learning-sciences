"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle, ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";

interface LearningContent {
    id: number;
    category: string;
    question: string;
    options: string[];
    answer: string;
    explanation: string;
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
        explanation: "'Serendipity' is a happy accident or pleasant surprise! It was coined by Horace Walpole in 1754."
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
        explanation: "'You're' is a contraction for 'You are'. so 'You are amazing!' makes sense. 'Your' shows possession."
    },
    {
        id: 3,
        category: "Literature",
        question: "In 'The Great Gatsby', who is Gatsby in love with?",
        options: ["Jordan Baker", "Daisy Buchanan", "Myrtle Wilson", "Nick Carraway"],
        answer: "Daisy Buchanan",
        explanation: "Jay Gatsby builds his entire fortune and persona to win back his former love, Daisy Buchanan."
    },
    {
        id: 4,
        category: "Idioms",
        question: "What does 'Break a leg' mean?",
        options: ["Get hurt", "Good luck", "Stop working", "Dance wildly"],
        answer: "Good luck",
        explanation: "It's a way to wish someone good luck, especially before a performance, to avoid 'jinxing' them."
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
        explanation: "A Haiku is a Japanese poetic form consisting of three phrases with a 5, 7, 5 syllable structure."
    }
];

export default function LearnPage() {
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState<boolean>(false);
    const [isCorrect, setIsCorrect] = useState<boolean>(false);
    const [attempts, setAttempts] = useState<number>(0);
    const [lessonComplete, setLessonComplete] = useState<boolean>(false);

    const currentQuestion = learningContent[currentIndex];
    const isLastQuestion = currentIndex === learningContent.length - 1;
    const maxAttempts = 3;

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
            // Logic handled in render via button click
        } else {
            setCurrentIndex((prev) => prev + 1);
            setSelectedOption(null);
            setIsAnswered(false);
            setIsCorrect(false);
            setAttempts(0);
        }
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

    return (
        <div className="flex min-h-screen flex-col p-6 md:p-12">
            <div className="mx-auto w-full max-w-2xl flex-1">

                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
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

                {/* Progress Bar */}
                <div className="mb-8 h-2 w-full overflow-hidden rounded-full bg-slate-200">
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
                        initial={{ x: 50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -50, opacity: 0 }}
                        className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-black/5"
                    >
                        <div className="mb-4 inline-block rounded-lg bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-500">
                            {currentQuestion.category}
                        </div>

                        <h2 className="mb-8 text-2xl font-bold leading-snug text-slate-800">
                            {currentQuestion.question}
                        </h2>

                        <div className="space-y-3">
                            {currentQuestion.options.map((option) => {
                                let style = "w-full rounded-xl border-2 p-4 text-left font-medium transition-all duration-200 relative";
                                const isSelected = option === selectedOption;

                                if (isAnswered) {
                                    // Revealed state
                                    if (option === currentQuestion.answer) {
                                        style += " border-green-500 bg-green-50 text-green-700";
                                    } else if (isSelected && !isCorrect) {
                                        style += " border-red-400 bg-red-50 text-red-700";
                                    } else {
                                        style += " border-slate-100 text-slate-400 opacity-50";
                                    }
                                } else {
                                    // Active state
                                    if (isSelected && option !== currentQuestion.answer) {
                                        // Wrong attempt state (temporary, until next click)
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
                                            {!isAnswered && isSelected && option !== currentQuestion.answer && (
                                                <span className="text-xs font-bold text-red-400">Try Again</span>
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
                                    <div className="mt-6 border-t border-slate-100 pt-6">
                                        <div className={`mb-2 flex items-center gap-2 font-bold ${isCorrect ? 'text-green-600' : 'text-red-500'}`}>
                                            {isCorrect ? 'Correct!' : 'Out of attempts!'}
                                            <span className="text-slate-800 font-normal">Here is the explanation:</span>
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
                <div className="mt-8 flex justify-end">
                    <button
                        onClick={() => {
                            if (isLastQuestion) {
                                setLessonComplete(true);
                            } else {
                                handleNext();
                            }
                        }}
                        disabled={!isAnswered}
                        className="group flex items-center gap-2 rounded-2xl bg-slate-900 px-8 py-4 text-lg font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                    >
                        {isLastQuestion ? "Finish Lesson" : "Next Question"}
                        <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
                    </button>
                </div>

            </div>
        </div>
    );
}
