import React from "react";
import { createServerCaller } from "@/trpc/server";
import { TaskList } from "@/components/TaskList";
import { Sparkles } from "lucide-react";

// Enforce dynamic Server-Side Rendering per request as specified in requirements
export const dynamic = "force-dynamic";

export default async function HomePage() {
  /**
   * REQUIREMENT: "Utilize Server-Side Rendering (SSR) to pre-load the task list."
   * The server-side caller runs directly within the Next.js server runtime,
   * retrieving initial tasks from the in-memory store and producing the full HTML markup
   * before sending the response to the browser.
   */
  const caller = await createServerCaller();
  const initialData = await caller.tarefas.listarInfinito({ limit: 6 });

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <section className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-500/10">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold backdrop-blur-sm mb-3">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>Server-Side Rendered (SSR) &amp; Infinite Scroll</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Productivity Task Management System
          </h1>
          <p className="mt-2 text-sm sm:text-base text-blue-100 leading-relaxed">
            Full-stack application engineered for the Artefact technical assessment.
            The in-memory backend is exposed via tRPC and the frontend utilizes SSR
            for instant paint followed by progressive React Query hydration.
          </p>
        </div>
      </section>

      {/* Task List Component with Infinite Scroll */}
      <TaskList initialData={initialData} />
    </div>
  );
}
