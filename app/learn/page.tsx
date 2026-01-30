"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle, ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import Chatbot, { Message } from "@/components/Chatbot";
import questionsData from "@/components/questions.json";
import { passage } from "@/components/passage";

// Transform JSON data to match our interface or use directly
const questions = questionsData.questions;

// Interface for History Tracking
interface QuestionHistory {
    selectedOption: string | null;
    isCorrect: boolean;
    isAnswered: boolean;
    attemptState: 'first_try' | 'reflection_pending' | 'retrying' | 'explanation_pending' | 'completed';
}

export default function LearnPage() {
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const [maxIndexReached, setMaxIndexReached] = useState<number>(0); // Furthest question reached

    // Per-question state (current view)
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState<boolean>(false);
    const [isCorrect, setIsCorrect] = useState<boolean>(false);
    const [attemptState, setAttemptState] = useState<'first_try' | 'reflection_pending' | 'retrying' | 'explanation_pending' | 'completed'>('first_try');

    // History of answers for "Back" navigation
    const [history, setHistory] = useState<Record<number, QuestionHistory>>({});

    const [lessonComplete, setLessonComplete] = useState<boolean>(false);

    // Chatbot State
    const [chatMessages, setChatMessages] = useState<Message[]>([
        { id: "intro", role: "bot", text: "Hi! I'm here to help you reflect on your learning. You can ask me questions anytime!" }
    ]);
    const [reflectionRequired, setReflectionRequired] = useState<boolean>(false);
    const [isChatLoading, setIsChatLoading] = useState<boolean>(false);

    const currentQuestion = questions[currentIndex];
    const isLastQuestion = currentIndex === questions.length - 1;

    // Helper to call Chat API
    const callChatbotAPI = async (messages: Message[], context?: any) => {
        setIsChatLoading(true);
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages,
                    context
                }),
            });
            const data = await response.json();
            if (data.message) {
                setChatMessages(prev => [...prev, { id: Date.now().toString(), role: "bot", text: data.message.content }]);
            }
        } catch (error) {
            console.error("Chat API Error:", error);
            setChatMessages(prev => [...prev, { id: "error", role: "bot", text: "Sorry, I'm having trouble connecting right now." }]);
        } finally {
            setIsChatLoading(false);
        }
    };

    // Trigger Chatbot logic when question is answered
    // (Removed redundant useEffect - logic moved to handleOptionClick to prevent double-firing)
    useEffect(() => {
        if (isAnswered && !isCorrect) {
            // Only ensure reflection is required if incorrect (safety check)
            setReflectionRequired(true);
        }
    }, [isAnswered, isCorrect]);

    // Restore state when navigating between questions
    useEffect(() => {
        const savedState = history[currentIndex];
        if (savedState) {
            // Restore context for Review Mode
            setSelectedOption(savedState.selectedOption);
            setIsAnswered(savedState.isAnswered);
            setIsCorrect(savedState.isCorrect);
            setAttemptState(savedState.attemptState);
            setReflectionRequired(false); // No reflection required in review mode
        } else {
            // New Question (fresh state)
            setSelectedOption(null);
            setIsAnswered(false);
            setIsCorrect(false);
            setAttemptState('first_try');
            setReflectionRequired(false);
        }
    }, [currentIndex, history]);


    const handleOptionClick = (optionKey: string) => {
        // If already answered (history exists or local state isAnswered), block changes
        const isReviewMode = !!history[currentIndex];

        if (isAnswered || isReviewMode || attemptState === 'reflection_pending' || attemptState === 'explanation_pending') return;

        setSelectedOption(optionKey);
        // Map Option Key (A, B, C, D) to content if needed, but logic uses Key
        const correct = optionKey === currentQuestion.correct_option;
        // @ts-ignore - JSON structure for options is valid but TS might want explicit type
        const answerContent = currentQuestion.options[optionKey];

        if (correct) {
            setIsCorrect(true);
            setIsAnswered(true);
            setAttemptState('completed');

            // Save to history immediately
            setHistory(prev => ({
                ...prev,
                [currentIndex]: {
                    selectedOption: optionKey,
                    isCorrect: true,
                    isAnswered: true,
                    attemptState: 'completed'
                }
            }));

            // Update Max Reached if this is the furthest
            if (currentIndex >= maxIndexReached) {
                setMaxIndexReached(currentIndex + 1);
            }

            // Trigger Success Praise (Empty History to avoid pollution)
            callChatbotAPI([], {
                type: 'success_feedback',
                question_text: currentQuestion.question,
                correct_answer: currentQuestion.correct_answer
            });

        } else {
            // INCORRECT LOGIC
            if (attemptState === 'first_try') {
                // First Fail -> Lock and Ask Reflection
                setAttemptState('reflection_pending');
                setReflectionRequired(true);

                // Pass empty history [] to ensure focus on reflection
                callChatbotAPI([], {
                    type: 'failure_reflection_1',
                    question_text: currentQuestion.question,
                    user_answer: answerContent,
                    correct_answer: currentQuestion.correct_answer,
                    // Note: JSON doesn't strictly have "explanation" field based on snippet, using placeholder or check data
                    // Looking at questions.json, there is NO explanation field. 
                    // We might need to omit explanation or generate generic one.
                    explanation: "Review the passage carefully."
                });
            } else if (attemptState === 'retrying') {
                // Second Fail -> Show Answer (Fail State), Ask Explanation
                setIsCorrect(false);
                setIsAnswered(true);
                setAttemptState('explanation_pending');
                setReflectionRequired(true);

                // Save to history so they can't change it anymore, even though it's wrong
                setHistory(prev => ({
                    ...prev,
                    [currentIndex]: {
                        selectedOption: optionKey,
                        isCorrect: false,
                        isAnswered: true,
                        attemptState: 'explanation_pending' // Or completed? Keeping it pending until they chat?
                        // Actually, let's allow them to finish the chat before "saving" as done.
                        // But wait, if they navigate away, they lose progress?
                        // For simplicity, let's treat "explanation_pending" as a blocking state.
                        // They CANNOT navigate away until they chat.
                    }
                }));

                // Pass empty history [] to ensure focus on explanation request
                callChatbotAPI([], {
                    type: 'failure_explanation_request',
                    question_text: currentQuestion.question,
                    user_answer: answerContent,
                    correct_answer: currentQuestion.correct_answer,
                    explanation: "Review the passage."
                });
            }
        }
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            // Only allow if current question is "done" (saved in history as completed/answered)
            // Or if we have already reached further (Review mode)

            // Basic check: Can we proceed?
            // If we are reviewing an old question, we can always go next up to maxIndexReached.
            // If we are at the latest question, it must be answered/completed.

            if (currentIndex < maxIndexReached) {
                setCurrentIndex((prev) => prev + 1);
            } else if (isAnswered && !reflectionRequired) {
                // Proceeding from latest
                setMaxIndexReached(currentIndex + 1);
                setCurrentIndex((prev) => prev + 1);
            }
        } else if (isLastQuestion && isAnswered && !reflectionRequired) {
            setLessonComplete(true);
        }
    };

    const handleBack = () => {
        if (currentIndex > 0) {
            setCurrentIndex((prev) => prev - 1);
        }
    }

    const handleUserMessage = async (text: string) => {
        // User sent a message
        const newMsg: Message = { id: Date.now().toString(), role: "user", text };
        setChatMessages(prev => [...prev, newMsg]);

        let nextContext = { type: 'general_chat' };

        // Handle Reply logic
        if (attemptState === 'reflection_pending') {
            setAttemptState('retrying'); // Unlock for 2nd try
            setReflectionRequired(false);
        } else if (attemptState === 'explanation_pending') {
            setAttemptState('completed'); // Allow next button
            setReflectionRequired(false);

            // Update history to mark as fully completed
            setHistory(prev => ({
                ...prev,
                [currentIndex]: {
                    ...prev[currentIndex],
                    attemptState: 'completed'
                }
            }));

            // Allow progression
            if (currentIndex >= maxIndexReached) {
                setMaxIndexReached(currentIndex + 1);
            }
        }

        // Call API
        await callChatbotAPI([...chatMessages, newMsg], nextContext);
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
                    <p className="mb-8 text-slate-600">You've completed the reading comprehension.</p>
                    <div className="flex flex-col gap-3">
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
    const canProceed = (currentIndex < maxIndexReached) || ((isAnswered || attemptState === 'completed') && !reflectionRequired);
    const canGoBack = currentIndex > 0;

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
                    Question {currentIndex + 1} of {questions.length}
                </div>
            </div>

            {/* content Grid */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 h-full min-h-0">

                {/* Left Column: Passage & Question */}
                <div className="flex flex-col h-full min-h-0 gap-4">

                    {/* Top: Passage (Scrollable) */}
                    <div className="flex-1 overflow-y-auto rounded-3xl bg-white p-6 shadow-md ring-1 ring-black/5">
                        <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed whitespace-pre-line">
                            <h2 className="text-lg font-bold mb-4 text-slate-900">Passage</h2>
                            {passage}
                        </div>
                    </div>

                    {/* Bottom: Question (Fixed height or flex) */}
                    <div className="flex-1 flex flex-col overflow-y-auto rounded-3xl bg-white p-6 shadow-md ring-1 ring-black/5">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentIndex}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex-1 flex flex-col"
                            >
                                <h2 className="mb-6 text-xl font-bold leading-snug text-slate-800">
                                    {currentQuestion.question}
                                </h2>

                                <div className="space-y-3 mb-6">
                                    {Object.entries(currentQuestion.options).map(([key, text]) => {
                                        let style = "w-full rounded-xl border-2 p-4 text-left font-medium transition-all duration-200 relative";
                                        const isSelected = key === selectedOption;

                                        if (isAnswered) {
                                            if (key === currentQuestion.correct_option) {
                                                style += " border-green-500 bg-green-50 text-green-700";
                                            } else if (isSelected && !isCorrect) {
                                                style += " border-red-400 bg-red-50 text-red-700";
                                            } else {
                                                style += " border-slate-100 text-slate-400 opacity-50";
                                            }
                                        } else {
                                            if (isSelected && key !== currentQuestion.correct_option) {
                                                style += " border-red-300 bg-white text-red-600 shake";
                                            } else {
                                                style += " border-slate-100 hover:border-blue-200 hover:bg-blue-50 text-slate-600 hover:text-blue-700";
                                            }
                                        }

                                        return (
                                            <button
                                                key={key}
                                                // @ts-ignore
                                                onClick={() => handleOptionClick(key)}
                                                disabled={isAnswered || attemptState === 'reflection_pending' || attemptState === 'explanation_pending'}
                                                className={style}
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <span className="shrink-0 font-bold text-slate-400">{key}</span>
                                                    <span className="flex-1">{text}</span>
                                                    {isAnswered && key === currentQuestion.correct_option && (
                                                        <CheckCircle size={20} className="text-green-500 shrink-0" />
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Attempts Indicator */}
                                {attemptState === 'retrying' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-4 text-center text-sm font-medium text-orange-500"
                                    >
                                        One more try! You can do it.
                                    </motion.div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Navigation Controls */}
                    <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm">
                        <button
                            onClick={handleBack}
                            disabled={!canGoBack}
                            className="flex items-center gap-2 px-4 py-2 font-medium text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:text-slate-900 transition"
                        >
                            <ArrowLeft size={18} /> Back
                        </button>

                        <button
                            onClick={handleNext}
                            disabled={!canProceed}
                            className="group flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 font-bold text-white shadow-md transition-transform hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                        >
                            {isLastQuestion ? "Finish" : "Next"}
                            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                        </button>
                    </div>

                </div>

                {/* Right Column: Chatbot */}
                <div className="h-[500px] lg:h-full min-h-0">
                    <Chatbot
                        messages={chatMessages}
                        onSendMessage={handleUserMessage}
                        inputEnabled={!isChatLoading}
                        placeholder={reflectionRequired ? "Please answer the tutor's question..." : "Ask me anything..."}
                        className="h-full"
                    />
                </div>
            </div>
        </div>
    );
}
