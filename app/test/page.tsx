"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

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

export default function TestPage() {
    const [selectedAnswers, setSelectedAnswers] = useState<SelectedAnswers>({});
    const [submitted, setSubmitted] = useState<boolean>(false);
    const [score, setScore] = useState<number>(0);

    const handleOptionSelect = (questionId: number, option: string) => {
        if (submitted) return;
        setSelectedAnswers((prev) => ({ ...prev, [questionId]: option }));
    };

    const handleSubmit = () => {
        let currentScore = 0;
        questions.forEach((q) => {
            if (selectedAnswers[q.id] === q.answer) {
                currentScore++;
            }
        });
        setScore(currentScore);
        setSubmitted(true);
    };

    return (
        <div className="min-h-screen p-6 pb-20 md:p-12">
            <Link
                href="/"
                className="mb-8 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-white/50 hover:text-slate-800"
            >
                <ArrowLeft size={16} /> Back to Home
            </Link>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-auto max-w-3xl"
            >
                <div className="mb-10 text-center">
                    <h1 className="text-4xl font-bold text-slate-800">Knowledge Check</h1>
                    <p className="mt-2 text-slate-600">
                        Answer the 5 questions below to see how well you know English!
                    </p>
                </div>

                <div className="space-y-6">
                    {questions.map((q, index) => (
                        <motion.div
                            key={q.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`overflow-hidden rounded-2xl border bg-white/60 p-6 shadow-sm backdrop-blur-md ${submitted
                                    ? selectedAnswers[q.id] === q.answer
                                        ? "border-green-200 bg-green-50/50"
                                        : "border-pink-200 bg-pink-50/50"
                                    : "border-white/40"
                                }`}
                        >
                            <h3 className="mb-4 text-xl font-semibold text-slate-800">
                                <span className="mr-2 text-slate-400">#{index + 1}</span>
                                {q.question}
                            </h3>

                            <div className="grid gap-3 sm:grid-cols-2">
                                {q.options.map((option) => {
                                    const isSelected = selectedAnswers[q.id] === option;
                                    const isCorrect = q.answer === option;
                                    const showResult = submitted;

                                    let buttonStyle =
                                        "relative flex items-center justify-between rounded-xl border p-4 text-left font-medium transition-all hover:shadow-md";

                                    if (showResult) {
                                        if (isCorrect) {
                                            buttonStyle += " border-green-400 bg-green-100 text-green-800";
                                        } else if (isSelected) {
                                            buttonStyle += " border-red-300 bg-red-100 text-red-800";
                                        } else {
                                            buttonStyle += " border-slate-200 bg-white/40 text-slate-400 opacity-60";
                                        }
                                    } else {
                                        if (isSelected) {
                                            buttonStyle +=
                                                " border-blue-400/50 bg-blue-100 text-blue-900 shadow-sm";
                                        } else {
                                            buttonStyle +=
                                                " border-slate-200 bg-white/40 text-slate-700 hover:border-blue-300 hover:bg-blue-50";
                                        }
                                    }

                                    return (
                                        <button
                                            key={option}
                                            onClick={() => handleOptionSelect(q.id, option)}
                                            disabled={submitted}
                                            className={buttonStyle}
                                        >
                                            <span>{option}</span>
                                            {showResult && isCorrect && (
                                                <CheckCircle size={20} className="text-green-600" />
                                            )}
                                            {showResult && isSelected && !isCorrect && (
                                                <XCircle size={20} className="text-red-500" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {!submitted ? (
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
                ) : (
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="mt-10 rounded-3xl bg-white p-8 text-center shadow-xl ring-1 ring-slate-100"
                    >
                        <h2 className="text-3xl font-bold text-slate-800">
                            You scored {score} out of {questions.length}
                        </h2>
                        <div className="mt-6 flex justify-center gap-4">
                            <button
                                onClick={() => {
                                    setSubmitted(false);
                                    setSelectedAnswers({});
                                    setScore(0);
                                    window.scrollTo({ top: 0, behavior: "smooth" });
                                }}
                                className="rounded-xl border-2 border-slate-200 px-6 py-3 font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
                            >
                                Try Again
                            </button>
                            <Link
                                href="/"
                                className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
                            >
                                Go Home
                            </Link>
                        </div>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}
