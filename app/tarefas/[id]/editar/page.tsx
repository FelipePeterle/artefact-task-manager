import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { createServerCaller } from "@/trpc/server";
import { TaskForm } from "@/components/TaskForm";
import { AlertCircle, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Editar Tarefa • Artefact Task Manager",
  description: "Atualizar os dados de uma tarefa existente.",
};

// Força SSR dinâmico para garantir dados frescos da tarefa
export const dynamic = "force-dynamic";

interface EditarPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditarTarefaPage({ params }: EditarPageProps) {
  const { id } = await params;
  const caller = await createServerCaller();

  let initialTask = null;
  let errorMessage: string | null = null;

  try {
    initialTask = await caller.tarefas.obterPorId({ id });
  } catch (err: any) {
    errorMessage = err?.message || "Tarefa não encontrada no servidor.";
  }

  if (!initialTask || errorMessage) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          Tarefa não encontrada
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          A tarefa solicitada (ID: <code className="font-mono">{id}</code>) não
          existe ou foi removida da memória do servidor.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para a listagem</span>
        </Link>
      </div>
    );
  }

  return <TaskForm mode="edit" initialTask={initialTask} />;
}
