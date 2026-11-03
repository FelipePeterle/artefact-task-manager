"use client";

import React from "react";
import Link from "next/link";
import { Task } from "@/server/schemas/task.schema";
import { Calendar, Edit3, Trash2 } from "lucide-react";

interface TaskCardProps {
  task: Task;
  onDeleteRequest: (task: Task) => void;
}

export function TaskCard({ task, onDeleteRequest }: TaskCardProps) {
  // Friendly date formatting in English
  const formattedDate = React.useMemo(() => {
    try {
      const date = new Date(task.dataCriacao);
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch {
      return "Date unavailable";
    }
  }, [task.dataCriacao]);

  return (
    <article className="group bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors line-clamp-2">
            {task.titulo}
          </h3>
        </div>

        {task.descricao ? (
          <p className="text-sm text-slate-600 mb-4 line-clamp-3 whitespace-pre-line leading-relaxed">
            {task.descricao}
          </p>
        ) : (
          <p className="text-xs text-slate-400 italic mb-4">
            No description provided.
          </p>
        )}
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{formattedDate}</span>
        </div>

        <div className="flex items-center gap-1">
          <Link
            href={`/tarefas/${task.id}/editar`}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit task"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </Link>

          <button
            type="button"
            onClick={() => onDeleteRequest(task)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
            title="Delete task"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </article>
  );
}
