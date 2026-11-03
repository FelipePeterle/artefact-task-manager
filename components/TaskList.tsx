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

  // tRPC infinite query using SSR pre-fetched data as initialData
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

  // Flatten pages into a single continuous list of tasks
  const allTasks = useMemo(() => {
    return data?.pages.flatMap((page) => page.items) ?? [];
  }, [data]);

  const totalTasks = data?.pages[0]?.total ?? initialData.total;

  // Real-time client-side search filter
  const filteredTasks = useMemo(() => {
    if (!searchTerm.trim()) return allTasks;
    const term = searchTerm.toLowerCase();
    return allTasks.filter(
      (t) =>
        t.titulo.toLowerCase().includes(term) ||
        (t.descricao && t.descricao.toLowerCase().includes(term))
    );
  }, [allTasks, searchTerm]);

  // Task deletion mutation via tRPC
  const deleteMutation = trpc.tarefas.deletar.useMutation({
    onSuccess: (deleted) => {
      toast.success(`Task "${deleted.titulo}" deleted successfully!`);
      setTaskToDelete(null);
      refetch();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to delete task.");
    },
  });

  const handleDeleteConfirm = () => {
    if (!taskToDelete) return;
    deleteMutation.mutate({ id: taskToDelete.id });
  };

  // Infinite Scroll with IntersectionObserver targeting sentinel element
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
      {/* Search and Action Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search tasks by title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 placeholder:text-slate-400"
          />
        </div>

        {/* Counter and Add Button */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700">
            <ListFilter className="w-3.5 h-3.5 text-slate-500" />
            <span>
              {filteredTasks.length} of {totalTasks} {totalTasks === 1 ? "task" : "tasks"}
            </span>
          </div>

          <Link
            href="/tarefas/nova"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </Link>
        </div>
      </div>

      {/* Task Grid */}
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
            {searchTerm ? "No matching tasks found" : "No tasks registered yet"}
          </h3>
          <p className="text-sm text-slate-500 max-w-sm mb-6">
            {searchTerm
              ? `No results match the query "${searchTerm}". Try a different keyword.`
              : "Your task list is clean! Create a new task now to start organizing your workflow."}
          </p>
          {searchTerm ? (
            <button
              onClick={() => setSearchTerm("")}
              className="px-4 py-2 text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Clear search
            </button>
          ) : (
            <Link
              href="/tarefas/nova"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl shadow-sm hover:bg-blue-700 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create New Task</span>
            </Link>
          )}
        </div>
      )}

      {/* Infinite Scroll Sentinel & Loading Feedback */}
      <div
        ref={observerTarget}
        className="py-6 flex flex-col items-center justify-center"
      >
        {isFetchingNextPage ? (
          <div className="flex items-center gap-2.5 text-sm font-medium text-blue-600 bg-blue-50/80 px-4 py-2 rounded-full border border-blue-100 shadow-sm animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading more tasks (Infinite Scroll)...</span>
          </div>
        ) : hasNextPage ? (
          <button
            type="button"
            onClick={() => fetchNextPage()}
            className="text-xs font-semibold text-slate-500 hover:text-blue-600 bg-white border border-slate-200 hover:border-blue-300 px-4 py-2 rounded-xl shadow-sm transition-all"
          >
            Load more tasks manually
          </button>
        ) : allTasks.length > 0 && !searchTerm ? (
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>All {totalTasks} tasks have been loaded.</span>
          </div>
        ) : null}
      </div>

      {/* Delete Confirmation Modal */}
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
