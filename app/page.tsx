"use client";

import { motion } from "framer-motion";
import { BookOpen, PenTool } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="mb-12 max-w-2xl"
      >
        <h1 className="mb-4 text-5xl font-bold tracking-tight text-slate-800 drop-shadow-sm md:text-7xl">
          Main Title
        </h1>
        <p className="mx-auto mt-6 max-w-lg text-lg text-slate-600">
          AI 학습도구
        </p>
      </motion.div>

      <div className="grid w-full max-w-5xl gap-6 md:grid-cols-3">
        {/* Learn A */}
        <Link href="/learn-a" className="group">
          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-64 cursor-pointer flex-col items-center justify-center rounded-3xl border border-white/20 bg-white/40 p-6 shadow-xl backdrop-blur-xl transition-all duration-300 hover:bg-white/60 hover:shadow-2xl hover:shadow-green-200/50"
          >
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-green-400 to-emerald-300 text-white shadow-lg transition-transform duration-300 group-hover:rotate-6">
              <BookOpen size={32} strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Learn A</h2>
          </motion.div>
        </Link>

        {/* Learn B */}
        <Link href="/learn-b" className="group">
          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-64 cursor-pointer flex-col items-center justify-center rounded-3xl border border-white/20 bg-white/40 p-6 shadow-xl backdrop-blur-xl transition-all duration-300 hover:bg-white/60 hover:shadow-2xl hover:shadow-blue-200/50"
          >
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-400 to-cyan-300 text-white shadow-lg transition-transform duration-300 group-hover:rotate-6">
              <BookOpen size={32} strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Learn B</h2>
          </motion.div>
        </Link>

        {/* Test */}
        <Link href="/test" className="group">
          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-64 cursor-pointer flex-col items-center justify-center rounded-3xl border border-white/20 bg-white/40 p-6 shadow-xl backdrop-blur-xl transition-all duration-300 hover:bg-white/60 hover:shadow-2xl hover:shadow-pink-200/50"
          >
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-pink-400 to-rose-300 text-white shadow-lg transition-transform duration-300 group-hover:-rotate-6">
              <PenTool size={32} strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Test</h2>
          </motion.div>
        </Link>
      </div>

      <footer className="absolute bottom-6 text-sm text-slate-400">
        © 2026 English Learning Platform
      </footer>
    </div>
  );
}
