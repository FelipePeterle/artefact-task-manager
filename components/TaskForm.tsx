"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/trpc/client";
import { Task } from "@/server/schemas/task.schema";
import { useToast } from "./Toast";
import {
  ArrowLeft,
  Check,
  Loader2,
  AlertCircle,
  FileText,
  Calendar,
} from "lucide-react";

interface TaskFormProps {
  mode: "create" | "edit";
  initialTask?: Task;
}

export function TaskForm({ mode, initialTask }: TaskFormProps) {
  const router = useRouter();
  const toast = useToast();
  const utils = trpc.useUtils();

  // Local state managed via functional hooks
  const [titulo, setTitulo] = useState(initialTask?.titulo ?? "");
  const [descricao, setDescricao] = useState(initialTask?.descricao ?? "");
  const [touched, setTouched] = useState({ titulo: false, descricao: false });
  const [backendError, setBackendError] = useState<string | null>(null);

  // Client-side real-time validation
  const tituloError = useMemo(() => {
    if (!touched.titulo) return null;
    const trimmed = titulo.trim();
    if (!trimmed) {
      return "Task title is required and cannot be empty or only whitespace.";
    }
    if (trimmed.length > 120) {
      return "Task title cannot exceed 120 characters.";
    }
    return null;
  }, [titulo, touched.titulo]);

  const descricaoError = useMemo(() => {
    if (!touched.descricao) return null;
    if (descricao.length > 1000) {
      return "Description cannot exceed 1000 characters.";
    }
    return null;
  }, [descricao, touched.descricao]);

  const isFormValid = useMemo(() => {
    const trimmed = titulo.trim();
    return trimmed.length > 0 && trimmed.length <= 120 && descricao.length <= 1000;
  }, [titulo, descricao]);

  // Task creation mutation via tRPC
  const createMutation = trpc.tarefas.criar.useMutation({
    onSuccess: (newTask) => {
      toast.success(`Task "${newTask.titulo}" created successfully!`);
      utils.tarefas.invalidate();
      router.push("/");
      router.refresh();
    },
    onError: (err) => {
      setBackendError(err.message || "Server error while creating task.");
      toast.error(err.message || "Server error while creating task.");
    },
  });

  // Task update mutation via tRPC
  const updateMutation = trpc.tarefas.atualizar.useMutation({
    onSuccess: (updatedTask) => {
      toast.success(`Task "${updatedTask.titulo}" updated successfully!`);
      utils.tarefas.invalidate();
      router.push("/");
      router.refresh();
    },
    onError: (err) => {
      setBackendError(err.message || "Server error while updating task.");
      toast.error(err.message || "Server error while updating task.");
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // Form submit handler
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setTouched({ titulo: true, descricao: true });
      setBackendError(null);

      // Preventive validation on client
      if (!titulo.trim()) {
        toast.error("Please enter a task title.");
        return;
      }

      if (mode === "create") {
        createMutation.mutate({
          titulo: titulo.trim(),
          descricao: descricao.trim() ? descricao.trim() : undefined,
        });
      } else if (mode === "edit" && initialTask) {
        updateMutation.mutate({
          id: initialTask.id,
          titulo: titulo.trim(),
          descricao: descricao.trim() ? descricao.trim() : undefined,
        });
      }
    },
    [titulo, descricao, mode, initialTask, createMutation, updateMutation, toast]
  );

  return (
    <div className="max-w-2xl mx-auto">
      {/* Return Button */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to task list</span>
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
        {/* Card Header */}
        <div className="mb-6 pb-6 border-b border-slate-100 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {mode === "create" ? "Create New Task" : "Edit Task"}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {mode === "create"
                ? "Fill in the details to register a new task in memory via tRPC."
                : "Update the selected task fields and save your changes."}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        {/* Backend Error Alert */}
        {backendError && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold">Backend Error Response:</p>
              <p className="mt-0.5">{backendError}</p>
            </div>
          </div>
        )}

        {/* Edit Metadata */}
        {mode === "edit" && initialTask && (
          <div className="mb-6 p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="font-mono">ID: {initialTask.id}</span>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>
                Created:{" "}
                {new Date(initialTask.dataCriacao).toLocaleString("en-US")}
              </span>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {/* Field: Title */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="titulo"
                className="text-sm font-semibold text-slate-900"
              >
                Task Title <span className="text-rose-500">*</span>
              </label>
              <span className="text-xs text-slate-400">
                {titulo.length}/120
              </span>
            </div>
            <input
              id="titulo"
              type="text"
              placeholder="e.g., Implement automated API integration tests"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              onBlur={() => setTouched((p) => ({ ...p, titulo: true }))}
              disabled={isSubmitting}
              className={`w-full px-4 py-2.5 text-sm rounded-xl border transition-all text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                tituloError
                  ? "border-rose-400 focus:ring-rose-200 focus:border-rose-500 bg-rose-50/20"
                  : "border-slate-300 focus:ring-blue-500/20 focus:border-blue-500"
              } disabled:opacity-50`}
            />
            {tituloError && (
              <p className="mt-1.5 text-xs font-medium text-rose-600 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{tituloError}</span>
              </p>
            )}
          </div>

          {/* Field: Description */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="descricao"
                className="text-sm font-semibold text-slate-900"
              >
                Detailed Description{" "}
                <span className="text-xs font-normal text-slate-500">
                  (Optional)
                </span>
              </label>
              <span className="text-xs text-slate-400">
                {descricao.length}/1000
              </span>
            </div>
            <textarea
              id="descricao"
              rows={4}
              placeholder="Additional details, acceptance criteria, or context notes..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              onBlur={() => setTouched((p) => ({ ...p, descricao: true }))}
              disabled={isSubmitting}
              className={`w-full px-4 py-2.5 text-sm rounded-xl border transition-all text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 resize-y ${
                descricaoError
                  ? "border-rose-400 focus:ring-rose-200 focus:border-rose-500"
                  : "border-slate-300 focus:ring-blue-500/20 focus:border-blue-500"
              } disabled:opacity-50`}
            />
            {descricaoError && (
              <p className="mt-1.5 text-xs font-medium text-rose-600 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{descricaoError}</span>
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Link
              href="/"
              className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={isSubmitting || (touched.titulo && !isFormValid)}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>
                    {mode === "create" ? "Creating task..." : "Saving..."}
                  </span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>
                    {mode === "create" ? "Create Task" : "Save Changes"}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
