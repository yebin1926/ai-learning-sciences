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
    const [isAnswered, setIsAnswered] = useState<boolean>(false); // True when question is fully "Done" (correct or failed twice)
    const [isCorrect, setIsCorrect] = useState<boolean>(false);
    const [lessonComplete, setLessonComplete] = useState<boolean>(false);

    // New Attempt Logic
    // 'first_try': Initial state
    // 'reflection_pending': Failed once, waiting for chat reflection
    // 'retrying': Chat satisfied, user can try again
    // 'explanation_pending': Failed twice, waiting for explanation reflection
    // 'completed': Done (Correct or Explanation Reflection satisfied)
    const [attemptState, setAttemptState] = useState<'first_try' | 'reflection_pending' | 'retrying' | 'explanation_pending' | 'completed'>('first_try');

    // Chatbot State
    const [chatMessages, setChatMessages] = useState<Message[]>([
        { id: "intro", role: "bot", text: "Hi! I'm here to help you reflect on your learning. You can ask me questions anytime!" }
    ]);
    const [reflectionRequired, setReflectionRequired] = useState<boolean>(false);
    const [isChatLoading, setIsChatLoading] = useState<boolean>(false);

    const currentQuestion = learningContent[currentIndex];
    const isLastQuestion = currentIndex === learningContent.length - 1;
    const maxAttempts = 3;

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

    const handleOptionClick = (option: string) => {
        if (isAnswered || attemptState === 'reflection_pending' || attemptState === 'explanation_pending') return;

        setSelectedOption(option);
        const correct = option === currentQuestion.answer;

        if (correct) {
            setIsCorrect(true);
            setIsAnswered(true);
            setAttemptState('completed');

            // Trigger Success Praise
            // Pass empty history [] to force bot to focus ONLY on the current success context, 
            // ignoring previous random chat (e.g. "hamsters").
            callChatbotAPI([], {
                type: 'success_feedback',
                question_text: currentQuestion.question,
                correct_answer: currentQuestion.answer
            });

        } else {
            // INCORRECT LOGIC
            if (attemptState === 'first_try') {
                // First Fail -> Lock and Ask Reflection
                setAttemptState('reflection_pending');
                setReflectionRequired(true); // Gates navigation + Shows "Answer Tutor" placeholder

                // Pass empty history [] to ensure focus on reflection
                callChatbotAPI([], {
                    type: 'failure_reflection_1',
                    question_text: currentQuestion.question,
                    user_answer: option,
                    correct_answer: currentQuestion.answer,
                    explanation: currentQuestion.explanation
                });
            } else if (attemptState === 'retrying') {
                // Second Fail -> Show Answer, Ask Explanation, Then Finish
                setIsCorrect(false);
                setIsAnswered(true); // Reveal answer visually
                setAttemptState('explanation_pending');
                setReflectionRequired(true);

                // Pass empty history [] to ensure focus on explanation request
                callChatbotAPI([], {
                    type: 'failure_explanation_request',
                    question_text: currentQuestion.question,
                    user_answer: option,
                    correct_answer: currentQuestion.answer,
                    explanation: currentQuestion.explanation
                });
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
            setAttemptState('first_try');
            setReflectionRequired(false);
            // Clear chat history for next question to prevent context pollution
            setChatMessages([{ id: `intro_${Date.now()}`, role: "bot", text: "New question! I'm here if you need help." }]);
        }
    };

    const handleUserMessage = async (text: string) => {
        // User sent a message
        const newMsg: Message = { id: Date.now().toString(), role: "user", text };
        setChatMessages(prev => [...prev, newMsg]);

        let nextContext = { type: 'general_chat' };

        // Handle Reply logic
        if (attemptState === 'reflection_pending') {
            setAttemptState('retrying'); // Unlock for 2nd try
            setReflectionRequired(false);
            // Theoretically we could pass context here to say "User reflected, now encourage retry"
        } else if (attemptState === 'explanation_pending') {
            setAttemptState('completed'); // Allow next button
            setReflectionRequired(false);
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
                    <p className="mb-8 text-slate-600">You've learned 5 new things today. Great job!</p>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => {
                                setLessonComplete(false);
                                setCurrentIndex(0);
                                setSelectedOption(null);
                                setIsAnswered(false);
                                setIsCorrect(false);
                                setAttemptState('first_try');
                                setReflectionRequired(false);
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
    // Only enabled if 'completed' AND strict reflection not required (redundant check but safe)
    const canProceed = (isAnswered || attemptState === 'completed') && !reflectionRequired;

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
                                            disabled={isAnswered || attemptState === 'reflection_pending' || attemptState === 'explanation_pending'}
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
                            {attemptState === 'retrying' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-4 text-center text-sm font-medium text-orange-500"
                                >
                                    One more try! You can do it.
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
                        inputEnabled={!isChatLoading}
                        placeholder={reflectionRequired ? "Please answer the tutor's question..." : "Ask me anything..."}
                        className="h-full"
                    />
                </div>
            </div>
        </div>
    );
}
