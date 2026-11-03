"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckSquare, PlusCircle, Sparkles } from "lucide-react";

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <Link
          href="/"
          className="flex items-center gap-3 group transition-transform active:scale-95"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 tracking-tight text-lg">
                Artefact
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium hidden sm:inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Next.js 15 + tRPC
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Task Manager • In-Memory CRUD
            </p>
          </div>
        </Link>

        {/* Navigation Buttons */}
        <nav className="flex items-center gap-3">
          <Link
            href="/"
            className={`text-sm font-medium px-3.5 py-2 rounded-lg transition-colors ${
              pathname === "/"
                ? "bg-slate-100 text-slate-900"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            All Tasks
          </Link>

          <Link
            href="/tarefas/nova"
            className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg bg-blue-600 text-white shadow-sm hover:bg-blue-700 active:scale-95 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Task</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
