"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { trpc } from "@/trpc/client";
import { Task } from "@/server/schemas/task.schema";
import { TaskCard } from "./TaskCard";
import { DeleteModal } from "./DeleteModal";
import { useToast } from "./Toast";
import {
  Search,
  PlusCircle,
  Inbox,
  Loader2,
  ListFilter,
  CheckCircle2,
} from "lucide-react";

interface InitialPageData {
  items: Task[];
  nextCursor: string | null;
  total: number;
}

interface TaskListProps {
  initialData: InitialPageData;
}

export function TaskList({ initialData }: TaskListProps) {
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const observerTarget = useRef<HTMLDivElement | null>(null);

  // Consulta infinita via tRPC com os dados do SSR injetados como initialData
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = trpc.tarefas.listarInfinito.useInfiniteQuery(
    { limit: 6 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      initialData: {
        pages: [initialData],
        pageParams: [undefined],
      },
      refetchOnWindowFocus: false,
    }
  );

  // Concatenação de todas as páginas em uma única lista plana de tarefas
  const allTasks = useMemo(() => {
    return data?.pages.flatMap((page) => page.items) ?? [];
  }, [data]);

  const totalTasks = data?.pages[0]?.total ?? initialData.total;

  // Filtro de busca no cliente
  const filteredTasks = useMemo(() => {
    if (!searchTerm.trim()) return allTasks;
    const term = searchTerm.toLowerCase();
    return allTasks.filter(
      (t) =>
        t.titulo.toLowerCase().includes(term) ||
        (t.descricao && t.descricao.toLowerCase().includes(term))
    );
  }, [allTasks, searchTerm]);

  // Mutation de deleção via tRPC
  const deleteMutation = trpc.tarefas.deletar.useMutation({
    onSuccess: (deleted) => {
      toast.success(`Tarefa "${deleted.titulo}" excluída com sucesso!`);
      setTaskToDelete(null);
      refetch();
    },
    onError: (err) => {
      toast.error(err.message || "Falha ao excluir a tarefa.");
    },
  });

  const handleDeleteConfirm = () => {
    if (!taskToDelete) return;
    deleteMutation.mutate({ id: taskToDelete.id });
  };

  // Infinite Scroll usando IntersectionObserver no elemento sentinel
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.2, rootMargin: "100px" }
    );

    const target = observerTarget.current;
    if (target) {
      observer.observe(target);
    }

    return () => {
      if (target) {
        observer.unobserve(target);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="space-y-6">
      {/* Barra de Ações e Filtro */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Campo de Busca */}
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por título ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 placeholder:text-slate-400"
          />
        </div>

        {/* Informações e Contador */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700">
            <ListFilter className="w-3.5 h-3.5 text-slate-500" />
            <span>
              {filteredTasks.length} de {totalTasks} {totalTasks === 1 ? "tarefa" : "tarefas"}
            </span>
          </div>

          <Link
            href="/tarefas/nova"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Adicionar</span>
          </Link>
        </div>
      </div>

      {/* Grid de Tarefas */}
      {filteredTasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onDeleteRequest={(t) => setTaskToDelete(t)}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <Inbox className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">
            {searchTerm ? "Nenhuma tarefa encontrada" : "Nenhuma tarefa cadastrada"}
          </h3>
          <p className="text-sm text-slate-500 max-w-sm mb-6">
            {searchTerm
              ? `Nenhum resultado corresponde ao termo "${searchTerm}". Tente outra pesquisa.`
              : "Sua lista está limpa! Crie uma nova tarefa agora para começar a gerenciar sua produtividade."}
          </p>
          {searchTerm ? (
            <button
              onClick={() => setSearchTerm("")}
              className="px-4 py-2 text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Limpar busca
            </button>
          ) : (
            <Link
              href="/tarefas/nova"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl shadow-sm hover:bg-blue-700 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Criar Nova Tarefa</span>
            </Link>
          )}
        </div>
      )}

      {/* Sentinel do Infinite Scroll & Feedback de Carregamento */}
      <div
        ref={observerTarget}
        className="py-6 flex flex-col items-center justify-center"
      >
        {isFetchingNextPage ? (
          <div className="flex items-center gap-2.5 text-sm font-medium text-blue-600 bg-blue-50/80 px-4 py-2 rounded-full border border-blue-100 shadow-sm animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Carregando mais tarefas (Infinite Scroll)...</span>
          </div>
        ) : hasNextPage ? (
          <button
            type="button"
            onClick={() => fetchNextPage()}
            className="text-xs font-semibold text-slate-500 hover:text-blue-600 bg-white border border-slate-200 hover:border-blue-300 px-4 py-2 rounded-xl shadow-sm transition-all"
          >
            Carregar mais tarefas manualmente
          </button>
        ) : allTasks.length > 0 && !searchTerm ? (
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Todas as {totalTasks} tarefas foram carregadas.</span>
          </div>
        ) : null}
      </div>

      {/* Modal de Confirmação de Exclusão */}
      <DeleteModal
        isOpen={Boolean(taskToDelete)}
        taskTitle={taskToDelete?.titulo ?? ""}
        isDeleting={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setTaskToDelete(null)}
      />
    </div>
  );
}
