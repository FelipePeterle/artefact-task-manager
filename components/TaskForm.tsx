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

  // Estados locais gerenciados via hooks funcionais
  const [titulo, setTitulo] = useState(initialTask?.titulo ?? "");
  const [descricao, setDescricao] = useState(initialTask?.descricao ?? "");
  const [touched, setTouched] = useState({ titulo: false, descricao: false });
  const [backendError, setBackendError] = useState<string | null>(null);

  // Validação em tempo de execução no frontend
  const tituloError = useMemo(() => {
    if (!touched.titulo) return null;
    const trimmed = titulo.trim();
    if (!trimmed) {
      return "O título da tarefa é obrigatório e não pode ser composto apenas por espaços.";
    }
    if (trimmed.length > 120) {
      return "O título não pode exceder 120 caracteres.";
    }
    return null;
  }, [titulo, touched.titulo]);

  const descricaoError = useMemo(() => {
    if (!touched.descricao) return null;
    if (descricao.length > 1000) {
      return "A descrição não pode exceder 1000 caracteres.";
    }
    return null;
  }, [descricao, touched.descricao]);

  const isFormValid = useMemo(() => {
    const trimmed = titulo.trim();
    return trimmed.length > 0 && trimmed.length <= 120 && descricao.length <= 1000;
  }, [titulo, descricao]);

  // Mutation de Criação via tRPC
  const createMutation = trpc.tarefas.criar.useMutation({
    onSuccess: (newTask) => {
      toast.success(`Tarefa "${newTask.titulo}" criada com sucesso!`);
      utils.tarefas.invalidate();
      router.push("/");
      router.refresh();
    },
    onError: (err) => {
      setBackendError(err.message || "Erro no servidor ao criar tarefa.");
      toast.error(err.message || "Erro no servidor ao criar tarefa.");
    },
  });

  // Mutation de Atualização via tRPC
  const updateMutation = trpc.tarefas.atualizar.useMutation({
    onSuccess: (updatedTask) => {
      toast.success(`Tarefa "${updatedTask.titulo}" atualizada com sucesso!`);
      utils.tarefas.invalidate();
      router.push("/");
      router.refresh();
    },
    onError: (err) => {
      setBackendError(err.message || "Erro no servidor ao atualizar tarefa.");
      toast.error(err.message || "Erro no servidor ao atualizar tarefa.");
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // Submissão do formulário
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setTouched({ titulo: true, descricao: true });
      setBackendError(null);

      // Validação impeditiva no frontend
      if (!titulo.trim()) {
        toast.error("Por favor, preencha o título da tarefa.");
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
      {/* Botão de Retorno */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para a listagem</span>
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
        {/* Cabeçalho do Card */}
        <div className="mb-6 pb-6 border-b border-slate-100 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {mode === "create" ? "Criar Nova Tarefa" : "Editar Tarefa"}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {mode === "create"
                ? "Preencha as informações para registrar uma nova tarefa em memória via tRPC."
                : "Altere os dados da tarefa selecionada e salve as alterações."}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        {/* Alerta de Erro do Backend */}
        {backendError && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold">Erro retornado pelo backend:</p>
              <p className="mt-0.5">{backendError}</p>
            </div>
          </div>
        )}

        {/* Metadados na Edição */}
        {mode === "edit" && initialTask && (
          <div className="mb-6 p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="font-mono">ID: {initialTask.id}</span>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>
                Criada em:{" "}
                {new Date(initialTask.dataCriacao).toLocaleString("pt-BR")}
              </span>
            </div>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {/* Campo: Título */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="titulo"
                className="text-sm font-semibold text-slate-900"
              >
                Título da Tarefa <span className="text-rose-500">*</span>
              </label>
              <span className="text-xs text-slate-400">
                {titulo.length}/120
              </span>
            </div>
            <input
              id="titulo"
              type="text"
              placeholder="Ex: Implementar testes automatizados da API"
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

          {/* Campo: Descrição */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="descricao"
                className="text-sm font-semibold text-slate-900"
              >
                Descrição detalhada{" "}
                <span className="text-xs font-normal text-slate-500">
                  (Opcional)
                </span>
              </label>
              <span className="text-xs text-slate-400">
                {descricao.length}/1000
              </span>
            </div>
            <textarea
              id="descricao"
              rows={4}
              placeholder="Detalhes adicionais, critérios de aceitação ou notas de contexto..."
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

          {/* Botões de Ação */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Link
              href="/"
              className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancelar
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
                    {mode === "create" ? "Criando tarefa..." : "Salvando..."}
                  </span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>
                    {mode === "create" ? "Cadastrar Tarefa" : "Salvar Alterações"}
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
