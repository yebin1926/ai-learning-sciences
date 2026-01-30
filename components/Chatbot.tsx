"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export interface Message {
    id: string;
    role: "bot" | "user";
    text: string;
}

interface ChatbotProps {
    messages: Message[];
    onSendMessage: (message: string) => Promise<void> | void;
    inputEnabled: boolean;
    isLoading?: boolean;
    actionNode?: React.ReactNode;
    placeholder?: string;
    className?: string;
}

export default function Chatbot({
    messages,
    onSendMessage,
    inputEnabled,
    actionNode,
    placeholder = "Type your reflection here...",
    className = "",
    isLoading = false,
}: ChatbotProps) {
    const [inputValue, setInputValue] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || !inputEnabled) return;
        onSendMessage(inputValue);
        setInputValue("");
    };

    return (
        <div className={`flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl ${className}`}>
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/50 p-4 backdrop-blur-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 shadow-sm">
                    <Sparkles size={20} />
                </div>
                <div>
                    <h3 className="font-bold text-slate-800">AI Tutor</h3>
                    <p className="text-xs font-medium text-slate-500">Always here to help</p>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 p-8 opacity-60">
                        <Bot size={48} className="mb-4 text-slate-300" />
                        <p>Start learning to chat with me!</p>
                    </div>
                )}

                <AnimatePresence initial={false}>
                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.3 }}
                            className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                            <div className={`flex max-w-[85%] items-start gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm ${msg.role === "user" ? "bg-slate-800 text-white" : "bg-white text-indigo-600 border border-indigo-100"}`}>
                                    {msg.role === "user" ? <User size={14} /> : <Bot size={14} />}
                                </div>
                                <div className={`rounded-2xl px-4 py-3 shadow-sm text-sm leading-relaxed ${msg.role === "user" ? "bg-slate-800 text-white rounded-tr-sm" : "bg-white text-slate-700 border border-slate-100 rounded-tl-sm"}`}>
                                    <div className={`prose prose-sm max-w-none ${msg.role === "user" ? "prose-invert" : ""}`}>
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {msg.text}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                    {isLoading && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex w-full justify-start"
                        >
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-indigo-600 border border-indigo-100 shadow-sm">
                                    <Bot size={14} />
                                </div>
                                <div className="rounded-2xl rounded-tl-sm border border-indigo-50 bg-white px-4 py-3 shadow-sm">
                                    <div className="flex space-x-1">
                                        <motion.div
                                            className="h-2 w-2 rounded-full bg-indigo-400"
                                            animate={{ y: [0, -5, 0] }}
                                            transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
                                        />
                                        <motion.div
                                            className="h-2 w-2 rounded-full bg-indigo-400"
                                            animate={{ y: [0, -5, 0] }}
                                            transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                                        />
                                        <motion.div
                                            className="h-2 w-2 rounded-full bg-indigo-400"
                                            animate={{ y: [0, -5, 0] }}
                                            transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-slate-100 bg-white p-4">
                {actionNode ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {actionNode}
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder={isLoading ? "Processing response..." : (inputEnabled ? placeholder : "Waiting for next question...")}
                            disabled={!inputEnabled || isLoading}
                            className="peer flex-1 rounded-full border border-slate-200 bg-slate-50 py-3 pl-5 pr-12 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-60 transition-all"
                        />
                        <button
                            type="submit"
                            disabled={!inputValue.trim() || !inputEnabled || isLoading}
                            className="absolute right-2 rounded-full bg-indigo-600 p-2 text-white shadow-md transition-all hover:bg-indigo-700 hover:shadow-lg hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none disabled:hover:scale-100"
                        >
                            <Send size={16} strokeWidth={2.5} />
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
