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
          Main Title <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-600">
            AI 학습도구
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-lg text-lg text-slate-600">
          Your friendly platform to learn literature and language, and test your
          skills.
        </p>
      </motion.div>

      <div className="grid w-full max-w-3xl gap-8 md:grid-cols-2">
        <Link href="/learn" className="group">
          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-64 cursor-pointer flex-col items-center justify-center rounded-3xl border border-white/20 bg-white/40 p-8 shadow-xl backdrop-blur-xl transition-all duration-300 hover:bg-white/60 hover:shadow-2xl hover:shadow-blue-200/50"
          >
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-400 to-cyan-300 text-white shadow-lg transition-transform duration-300 group-hover:rotate-6">
              <BookOpen size={40} strokeWidth={2.5} />
            </div>
            <h2 className="text-3xl font-bold text-slate-800">Learn</h2>
            <p className="mt-2 text-slate-600">
              Explore lessons & stories
            </p>
          </motion.div>
        </Link>

        <Link href="/test" className="group">
          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-64 cursor-pointer flex-col items-center justify-center rounded-3xl border border-white/20 bg-white/40 p-8 shadow-xl backdrop-blur-xl transition-all duration-300 hover:bg-white/60 hover:shadow-2xl hover:shadow-pink-200/50"
          >
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-pink-400 to-rose-300 text-white shadow-lg transition-transform duration-300 group-hover:-rotate-6">
              <PenTool size={40} strokeWidth={2.5} />
            </div>
            <h2 className="text-3xl font-bold text-slate-800">Test</h2>
            <p className="mt-2 text-slate-600">
              Challenge yourself
            </p>
          </motion.div>
        </Link>
      </div>

      <footer className="absolute bottom-6 text-sm text-slate-400">
        © 2026 English Learning Platform
      </footer>
    </div>
  );
}
