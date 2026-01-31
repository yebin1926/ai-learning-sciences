"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle, ArrowLeft, XCircle, AlertCircle, Info, Clock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Chatbot, { Message } from "@/components/Chatbot";
import questionsData from "@/components/questions.json";
import { passage } from "@/components/passage";
import Image from "next/image";

import endingGuide from "@/components/ending-guide1.json";

const questions = questionsData.questions;

interface QuestionHistory {
    selectedOption: string | null;
    isCorrect: boolean;
    isAnswered: boolean;
    attemptState: 'first_try' | 'reflection_pending' | 'retrying' | 'explanation_pending' | 'completed';
}

interface LearnSessionProps {
    participantId: string;
    mode: 'A' | 'B';
}

export default function LearnSession({ participantId, mode }: LearnSessionProps) {
    const router = useRouter();

    // --- Learn Page State ---
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const [maxIndexReached, setMaxIndexReached] = useState<number>(0);

    // Per-question state
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState<boolean>(false);
    const [isCorrect, setIsCorrect] = useState<boolean>(false);
    const [attemptState, setAttemptState] = useState<'first_try' | 'reflection_pending' | 'retrying' | 'explanation_pending' | 'completed'>('first_try');

    // UX State
    const [consecutiveCorrect, setConsecutiveCorrect] = useState<number>(0);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [alertType, setAlertType] = useState<'error' | 'warning'>('error');

    // Timer State (60s = 1m) [TESTING]
    const [timeLeft, setTimeLeft] = useState<number>(900);
    const [hasLogged, setHasLogged] = useState<boolean>(false);


    const [history, setHistory] = useState<Record<number, QuestionHistory>>({});
    const [lessonComplete, setLessonComplete] = useState<boolean>(false);

    // Chatbot State
    const [chatMessages, setChatMessages] = useState<Message[]>([
        { id: "intro", role: "bot", text: "안녕하세요! 학습하시다가 궁금한 점이 생기면 언제든 물어봐주세요!" }
    ]);
    const [reflectionRequired, setReflectionRequired] = useState<boolean>(false);
    const [isChatLoading, setIsChatLoading] = useState<boolean>(false);

    const currentQuestion = questions[currentIndex];
    const isLastQuestion = currentIndex === questions.length - 1;

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

    const logSessionData = async () => {
        if (hasLogged) return;
        setHasLogged(true);

        try {
            await fetch('/api/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    participantId,
                    type: 'learn',
                    data: {
                        group: mode, // Log A or B
                        history,
                        chatMessages,
                        completedAt: new Date().toISOString()
                    }
                })
            });
        } catch (error) {
            console.error("Failed to log learning session:", error);
        }
    };


    const callChatbotAPI = async (messages: Message[], context?: any) => {
        setIsChatLoading(true);
        const newBotMsgId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        // Optimistically add an empty bot message to stream into
        setChatMessages(prev => [...prev, { id: newBotMsgId, role: "bot", text: "" }]);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages, context, mode }),
            });

            if (!response.body) throw new Error("No response body");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let done = false;
            let fullText = "";

            while (!done) {
                const { value, done: doneReading } = await reader.read();
                done = doneReading;
                const chunkValue = decoder.decode(value, { stream: true });
                fullText += chunkValue;

                setChatMessages(prev => prev.map(msg =>
                    msg.id === newBotMsgId ? { ...msg, text: fullText } : msg
                ));
            }
        } catch (error) {
            console.error("Chat API Error:", error);
            setChatMessages(prev => [...prev, { id: "error", role: "bot", text: "Sorry, I'm having trouble connecting right now." }]);
        } finally {
            setIsChatLoading(false);
        }
    };

    // --- Effects (Timer) ---
    useEffect(() => {
        if (lessonComplete) return;

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
    }, [lessonComplete]);

    useEffect(() => {
        if (timeLeft === 30) {
            showAlert("30 seconds left!", 'warning');
        } else if (timeLeft === 10) {
            showAlert("10 seconds left!", 'warning');
        } else if (timeLeft === 0 && !lessonComplete) {
            // TIME OVER
            handleFinishLesson();
        }
    }, [timeLeft, lessonComplete]);

    const handleFinishLesson = () => {
        setLessonComplete(true);
        logSessionData();
    };

    // --- Effects (Learn Page) ---

    // SAFETY LATCH: Ensure Explanation Pending ALWAYS implies Failure
    useEffect(() => {
        // [L79] Logging Safety Check
        if (attemptState === 'explanation_pending') {
            console.log(`[L79] Safety Latch Check: attemptState=${attemptState}, isCorrect=${isCorrect}`);
        }

        if (attemptState === 'explanation_pending' && isCorrect) {
            console.warn("[L84] State Mismatch Detected: explanation_pending but isCorrect=true. Forcing False.");
            setIsCorrect(false);
        }
    }, [attemptState, isCorrect]);

    useEffect(() => {
        if (mode === 'A') return; // Mode A never requires reflection
        if (isAnswered && !isCorrect) {
            setReflectionRequired(true);
        }
    }, [isAnswered, isCorrect, mode]);

    useEffect(() => {
        const savedState = history[currentIndex];
        if (savedState) {
            setSelectedOption(savedState.selectedOption);
            setIsAnswered(savedState.isAnswered);
            setIsCorrect(savedState.isCorrect);
            setAttemptState(savedState.attemptState);
            setReflectionRequired(false);
        } else {
            // New Question (fresh state)
            setSelectedOption(null);
            setIsAnswered(false);
            setIsCorrect(false);
            setAttemptState('first_try');
            setReflectionRequired(false);
        }
    }, [currentIndex, history]);


    // --- Handlers (Learn Page) ---

    const handleOptionClick = (optionKey: string) => {
        // [L117] Entry Log
        console.log(`[L117] handleOptionClick START`, {
            optionKey,
            attemptState,
            isAnswered,
            historyForIndex: history[currentIndex]
        });

        if (isChatLoading) {
            showAlert("Please wait for the tutor to finish responding.");
            return;
        }
        if (attemptState === 'reflection_pending' || attemptState === 'explanation_pending') {
            showAlert("Please answer the tutor's question first!");
            return;
        }

        const isReviewMode = !!history[currentIndex];
        if (isAnswered || isReviewMode) return;

        setSelectedOption(optionKey);
        const correct = optionKey === currentQuestion.correct_option;
        // @ts-ignore
        const answerContent = currentQuestion.options[optionKey];

        if (correct) {
            // CORRECT
            console.log("[L138] Correct Answer Branch Taken");
            setIsCorrect(true);
            setIsAnswered(true);
            setAttemptState('completed');

            const newStreak = consecutiveCorrect + 1;
            setConsecutiveCorrect(newStreak);

            setHistory(prev => ({
                ...prev,
                [currentIndex]: {
                    selectedOption: optionKey,
                    isCorrect: true,
                    isAnswered: true,
                    attemptState: 'completed'
                }
            }));

            if (currentIndex >= maxIndexReached) setMaxIndexReached(currentIndex + 1);

            if (mode === 'B') {
                console.log("[L171] Calling Chatbot: Success Feedback (Every Correct Answer)");
                callChatbotAPI([], {
                    type: 'success_feedback',
                    question_text: currentQuestion.question,
                    correct_answer: currentQuestion.correct_answer
                });
            }
            setConsecutiveCorrect(0); // Reset or keep unused, logic simplified

        } else {
            // INCORRECT
            console.log("[L170] Incorrect Answer Branch Taken");
            setConsecutiveCorrect(0);

            if (attemptState === 'first_try') {
                // First Fail
                console.log("[L175] 1st Try Fail Logic");
                setAttemptState('reflection_pending');
                setReflectionRequired(true);

                if (mode === 'B') {
                    console.log("[L190] Calling Chatbot: Failure Reflection 1");
                    callChatbotAPI([], {
                        type: 'failure_reflection_1',
                        question_text: currentQuestion.question,
                        user_answer: answerContent,
                        correct_answer: currentQuestion.correct_answer,
                        explanation: "Review the passage carefully."
                    });
                } else {
                    // Mode A: NO RETRIES on fail. Treat as completed (failed).
                    console.log("[Mode A] 1st Try Fail -> Mark Completed (Failed)");
                    setAttemptState('completed'); // Mark as done so they can proceed
                    setIsAnswered(true);
                    setIsCorrect(false);
                    // Update history to finalize this question state
                    setHistory(prev => ({
                        ...prev,
                        [currentIndex]: {
                            selectedOption: optionKey,
                            isCorrect: false,
                            isAnswered: true,
                            attemptState: 'completed'
                        }
                    }));
                    if (currentIndex >= maxIndexReached) setMaxIndexReached(currentIndex + 1);
                }
            } else if (attemptState === 'retrying') {
                // Second Fail -> LOGICALLY FAIL
                console.log("[L187] 2nd Failure Logic START - Setting isCorrect=false");
                setConsecutiveCorrect(0);
                setIsCorrect(false);
                setIsAnswered(true);
                setAttemptState('explanation_pending');
                setReflectionRequired(true);

                setHistory(prev => {
                    const newState = {
                        ...prev,
                        [currentIndex]: {
                            selectedOption: optionKey, // Save the WRONG choice
                            isCorrect: false,
                            isAnswered: true,
                            attemptState: 'explanation_pending' as const
                        }
                    };
                    console.log("[L203] 2nd Failure: Updated History State:", newState[currentIndex]);
                    return newState;
                });

                if (mode === 'B') {
                    console.log("[L220] Calling Chatbot: Failure Explanation Request");
                    callChatbotAPI([], {
                        type: 'failure_explanation_request',
                        question_text: currentQuestion.question,
                        user_answer: answerContent,
                        correct_answer: currentQuestion.correct_answer,
                        explanation: "Review the passage and explain why the user_answer is incorrect and why the correct_answer is correct, but keep it short and concise so that it's easy to understand."
                    });
                }
            } else {
                console.log(`[L211] Unexpected attemptState in incorrect branch: ${attemptState}`);
            }
        }
    };

    const handleNext = () => {
        if (isChatLoading) {
            showAlert("Please wait for the tutor.");
            return;
        }
        if (mode === 'B' && reflectionRequired) { // Only block in Mode B
            showAlert("Please answer the tutor's question first!");
            return;
        }

        if (currentIndex < questions.length - 1) {
            if (currentIndex < maxIndexReached) {
                setCurrentIndex((prev) => prev + 1);
            } else if (isAnswered) {
                setMaxIndexReached(currentIndex + 1);
                setCurrentIndex((prev) => prev + 1);
            }
        } else if (isLastQuestion && isAnswered) {
            handleFinishLesson();
        }
    };

    const handleBack = () => {
        if (isChatLoading) {
            showAlert("Please wait.");
            return;
        }
        if (currentIndex > 0) {
            setCurrentIndex((prev) => prev - 1);
        }
    }

    const handleUserMessage = async (text: string) => {
        if (isChatLoading) return;
        setAlertMessage(null);

        const newMsg: Message = { id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, role: "user", text };
        setChatMessages(prev => [...prev, newMsg]);

        let nextContext = { type: 'general_chat' };

        if (attemptState === 'reflection_pending') {
            setAttemptState('retrying');
            setReflectionRequired(false);
        } else if (attemptState === 'explanation_pending') {
            setAttemptState('completed');
            setReflectionRequired(false);
            setHistory(prev => ({
                ...prev,
                [currentIndex]: {
                    ...prev[currentIndex],
                    attemptState: 'completed'
                }
            }));
            if (currentIndex >= maxIndexReached) setMaxIndexReached(currentIndex + 1);
        }

        console.log("[L290] Calling Chatbot: General Chat / User Reply");
        await callChatbotAPI([...chatMessages, newMsg], nextContext);
    };

    const handlePostSurveyComplete = () => {
        router.push('/');
    };


    // --- RENDER: LESSON COMPLETE (POST-SURVEY) ---
    if (lessonComplete) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-[95%] md:w-[80%] lg:w-[60%] bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col h-[90vh]"
                >
                    <div className="bg-slate-900 p-6 text-white shrink-0">
                        <h1 className="text-2xl font-bold leading-tight">{endingGuide.title}</h1>
                    </div>

                    <div className="flex-1 flex flex-col overflow-y-auto">
                        <div className="p-8 space-y-6">
                            {endingGuide.sections.map((section, idx) => (
                                <p key={idx} className="text-slate-700 leading-relaxed whitespace-pre-line text-lg">
                                    {section.text}
                                </p>
                            ))}
                            <div className="w-full border-2 border-slate-100 rounded-2xl overflow-hidden bg-white">
                                <iframe
                                    src="https://snuss1.qualtrics.com/jfe/form/SV_0lA998ZZ6jUCZE2"
                                    className="w-full h-[600px] md:h-[500px]"
                                    frameBorder="0"
                                    title="Post Survey"
                                ></iframe>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
                        <button
                            onClick={handlePostSurveyComplete}
                            className="flex items-center gap-2 px-8 py-3 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 shadow-lg transition-transform active:scale-95"
                        >
                            Next <ArrowRight size={20} />
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    const canProceed = mode === 'A'
        ? (currentIndex < maxIndexReached || isAnswered || attemptState === 'completed') // Mode A: Simple gating
        : (currentIndex < maxIndexReached) || ((isAnswered || attemptState === 'completed') && !reflectionRequired); // Mode B: Reflection gating

    const canGoBack = currentIndex > 0;

    return (
        <div className="flex min-h-screen flex-col p-4 md:p-8 max-h-screen overflow-hidden relative">

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


            {/* Header */}
            <div className="flex items-center justify-between mb-4 px-2">
                <Link href="/" className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-white/50 hover:text-slate-800">
                    <ArrowLeft size={16} /> Home
                </Link>

                <div className="flex items-center gap-4">
                    {/* Timer Badge */}
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full font-bold text-sm ${timeLeft <= 30 ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                        <Clock size={16} />
                        <span>{formatTime(timeLeft)}</span>
                    </div>
                    <div className="text-sm font-bold text-slate-400">Question {currentIndex + 1} of {questions.length}</div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-0">

                {/* Left Column: Passage + Question */}
                <div className="lg:col-span-2 flex flex-col h-full min-h-0 gap-4">

                    {/* Top: Passage (Taller) */}
                    <div className="flex-[2] overflow-y-auto rounded-3xl bg-white p-6 shadow-md ring-1 ring-black/5">
                        <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed whitespace-pre-line">
                            <h2 className="text-lg font-bold mb-4 text-slate-900">Passage</h2>
                            {passage}
                            <div className="flex flex-col md:flex-row gap-4 mt-6 items-center justify-center">
                                <div className="border p-2 rounded-lg"><Image src="/figure1.png" alt="Figure 1" width={450} height={300} className="rounded object-contain" /></div>
                                <div className="border p-2 rounded-lg"><Image src="/figure2.png" alt="Figure 2" width={450} height={300} className="rounded object-contain" /></div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom: Question (Shorter) */}
                    <div className="flex-[1] flex flex-col overflow-y-auto rounded-3xl bg-white p-6 shadow-md ring-1 ring-black/5">
                        <AnimatePresence mode="wait">
                            <motion.div key={currentIndex} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col">

                                {/* QUESTION HEADER */}
                                <div className="mb-4">
                                    {/* FEEDBACK BANNER - Explicit Status */}
                                    {isAnswered && (
                                        <div className={`mb-4 rounded-xl p-3 flex items-center gap-3 ${isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {isCorrect ? <CheckCircle size={24} /> : <XCircle size={24} />}
                                            <span className="font-bold text-lg">
                                                {isCorrect ? "Correct!" : `Incorrect. The correct answer was ${currentQuestion.correct_option}.`}
                                            </span>
                                        </div>
                                    )}
                                    <h2 className="text-lg font-bold leading-snug text-slate-800">{currentQuestion.question}</h2>
                                </div>


                                <div className="space-y-3 mb-6">
                                    {/* OPTIONS */}
                                    {Object.entries(currentQuestion.options).map(([key, text]) => {
                                        let style = "w-full rounded-xl border-2 p-4 text-left font-medium transition-all duration-200 relative group";
                                        const isSelected = key === selectedOption;
                                        const isCorrectKey = key === currentQuestion.correct_option;

                                        if (isAnswered) {
                                            if (isCorrectKey) {
                                                if (isCorrect) {
                                                    // USER WON -> ALL GREEN
                                                    style += " border-green-500 bg-green-50 text-green-700";
                                                } else {
                                                    // USER LOST -> REVEAL
                                                    // Change: Show correct answer in GREEN even if they failed
                                                    style += " border-green-500 bg-green-50 text-green-700";
                                                }
                                            } else if (isSelected && !isCorrect) {
                                                // WRONG CHOICE
                                                style += " border-red-500 bg-red-100 text-red-800 ring-2 ring-red-200";
                                            } else {
                                                style += " border-slate-100 text-slate-400 opacity-50";
                                            }
                                        } else {
                                            if (isSelected && !isCorrectKey) {
                                                style += " border-red-300 bg-white text-red-600 shake";
                                            } else {
                                                style += " border-slate-100 hover:border-blue-200 hover:bg-blue-50 text-slate-600 hover:text-blue-700";
                                            }
                                        }

                                        if (isChatLoading) style += " opacity-50 cursor-wait";

                                        return (
                                            <button
                                                key={key}
                                                // @ts-ignore
                                                onClick={() => handleOptionClick(key)}
                                                className={style}
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <span className="shrink-0 font-bold text-slate-400">{key}</span>
                                                    <span className="flex-1">{text}</span>

                                                    {/* Success Icon */}
                                                    {isAnswered && isCorrectKey && isCorrect && (
                                                        <CheckCircle size={20} className="text-green-500 shrink-0" />
                                                    )}

                                                    {/* Failure Icon on SELECTED option */}
                                                    {isAnswered && isSelected && !isCorrect && (
                                                        <XCircle size={20} className="text-red-500 shrink-0" />
                                                    )}

                                                    {/* Reveal Badge (Neutral) - ONLY label, no big check */}
                                                    {isAnswered && isCorrectKey && !isCorrect && (
                                                        <span className="text-xs font-bold text-slate-600 border border-slate-200 px-2 py-1 rounded inline-flex items-center gap-1">
                                                            <Info size={12} /> Correct Answer
                                                        </span>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Navigation */}
                    <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm">
                        <button onClick={handleBack} disabled={!canGoBack || isChatLoading} className="flex items-center gap-2 px-4 py-2 font-medium text-slate-600 disabled:opacity-30 hover:text-slate-900 transition">
                            <ArrowLeft size={18} /> Back
                        </button>

                        <button
                            onClick={handleNext}
                            className={`group flex items-center gap-2 rounded-xl px-6 py-3 font-bold text-white shadow-md transition-transform active:scale-95
                                ${!canProceed || isChatLoading ? 'bg-slate-300 cursor-not-allowed' : 'bg-slate-900 hover:scale-105'}
                            `}
                        >
                            {isLastQuestion ? "Finish" : "Next"}
                            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                        </button>
                    </div>

                </div>

                {/* Right Column: Chatbot */}
                <div className="lg:col-span-1 h-[500px] lg:h-full min-h-0">
                    <Chatbot
                        messages={chatMessages}
                        onSendMessage={handleUserMessage}
                        inputEnabled={!isChatLoading}
                        isLoading={isChatLoading}
                        placeholder={reflectionRequired ? "튜터의 질문에 먼저 대답해주세요..." : "무엇이든 물어보세요..."}
                        className="h-full"
                    />
                </div>
            </div>
        </div>
    );
}
