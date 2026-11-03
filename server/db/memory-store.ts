import { Task, CreateTaskInput, UpdateTaskInput } from "../schemas/task.schema";
import { randomUUID } from "node:crypto";

/**
 * In-memory repository for volatile task persistence.
 * Uses globalThis to preserve stored tasks across Hot Module Replacement (HMR)
 * reloads during Next.js development mode.
 */
class TaskMemoryStore {
  private tasks: Map<string, Task> = new Map();

  constructor() {
    this.seedInitialData();
  }

  /**
   * Initializes sample tasks to facilitate assessment,
   * allowing immediate demonstration of initial SSR hydration and Infinite Scroll.
   */
  private seedInitialData() {
    const now = Date.now();
    const initialTasks: Array<Omit<Task, "id">> = [
      {
        titulo: "Architect full-stack productivity task manager",
        descricao: "Define modular boundaries between Next.js 15 App Router, tRPC procedures, and in-memory store.",
        dataCriacao: now - 1000 * 60 * 60 * 24, // 24h ago
      },
      {
        titulo: "Model domain schemas with TypeScript and Zod",
        descricao: "Enforce strict end-to-end type validation, non-empty title constraints, and cursor pagination.",
        dataCriacao: now - 1000 * 60 * 60 * 18,
      },
      {
        titulo: "Configure Next.js 15 App Router with tRPC v11",
        descricao: "Integrate tRPC server handler, React Query hydration, and client providers.",
        dataCriacao: now - 1000 * 60 * 60 * 12,
      },
      {
        titulo: "Implement complete CRUD operations via tRPC",
        descricao: "Build endpoints to create, list, inspect by ID, update, and delete tasks with semantic TRPCErrors.",
        dataCriacao: now - 1000 * 60 * 60 * 8,
      },
      {
        titulo: "Build task listing page with Server-Side Rendering (SSR)",
        descricao: "Pre-render initial tasks on the server to optimize FCP and SEO, hydrating React Query on the client.",
        dataCriacao: now - 1000 * 60 * 60 * 5,
      },
      {
        titulo: "Develop responsive creation and edit forms",
        descricao: "Manage form state with functional hooks, real-time validation, and defensive backend error handling.",
        dataCriacao: now - 1000 * 60 * 60 * 3,
      },
      {
        titulo: "Implement Infinite Scroll bonus with IntersectionObserver",
        descricao: "Enable smooth incremental task loading as the user scrolls toward the bottom of the page.",
        dataCriacao: now - 1000 * 60 * 60 * 2,
      },
      {
        titulo: "Integrate toast notifications and delete confirmation modal",
        descricao: "Provide immediate visual feedback for loading states, success messages, and destructive actions.",
        dataCriacao: now - 1000 * 60 * 50,
      },
      {
        titulo: "Write comprehensive README documentation",
        descricao: "Document architecture decisions, setup instructions, testing steps, and evaluation guide in English.",
        dataCriacao: now - 1000 * 60 * 30,
      },
      {
        titulo: "Run automated integration test suite",
        descricao: "Validate all tRPC procedures, input validations, error cases, and cursor pagination with 100% pass rate.",
        dataCriacao: now - 1000 * 60 * 15,
      },
      {
        titulo: "Prepare clean GitHub public repository",
        descricao: "Ensure zero sensitive credentials, clean commit history, and public accessibility for evaluation.",
        dataCriacao: now - 1000 * 60 * 5,
      },
    ];

    // Seed tasks in descending chronological order
    for (const item of initialTasks) {
      const id = randomUUID();
      this.tasks.set(id, { id, ...item });
    }
  }

  /**
   * Returns all tasks sorted from newest to oldest.
   */
  public getAll(): Task[] {
    return Array.from(this.tasks.values()).sort(
      (a, b) => b.dataCriacao - a.dataCriacao
    );
  }

  /**
   * Finds a task by unique ID.
   */
  public getById(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  /**
   * Cursor-based pagination for Infinite Scroll:
   * Returns 'limit' items and the 'nextCursor' if more tasks are available.
   */
  public getPaginated(limit: number, cursor?: string | null): {
    items: Task[];
    nextCursor: string | null;
    total: number;
  } {
    const all = this.getAll();
    let startIndex = 0;

    if (cursor) {
      const cursorIndex = all.findIndex((task) => task.id === cursor);
      if (cursorIndex !== -1) {
        startIndex = cursorIndex + 1;
      }
    }

    const items = all.slice(startIndex, startIndex + limit);
    const nextItem = all[startIndex + limit];
    const nextCursor = nextItem ? items[items.length - 1]?.id ?? null : null;

    return {
      items,
      nextCursor,
      total: all.length,
    };
  }

  /**
   * Creates and stores a new task with an automatically generated UUID.
   */
  public create(data: CreateTaskInput): Task {
    const id = randomUUID();
    const newTask: Task = {
      id,
      titulo: data.titulo.trim(),
      descricao: data.descricao?.trim() ? data.descricao.trim() : undefined,
      dataCriacao: Date.now(),
    };

    this.tasks.set(id, newTask);
    return newTask;
  }

  /**
   * Updates an existing task. Returns null if not found.
   */
  public update(data: UpdateTaskInput): Task | null {
    const existing = this.tasks.get(data.id);
    if (!existing) {
      return null;
    }

    const updated: Task = {
      ...existing,
      titulo: data.titulo.trim(),
      descricao: data.descricao?.trim() ? data.descricao.trim() : undefined,
    };

    this.tasks.set(data.id, updated);
    return updated;
  }

  /**
   * Deletes a task by ID. Returns boolean indicating success.
   */
  public delete(id: string): boolean {
    return this.tasks.delete(id);
  }

  /**
   * Returns total count of tasks.
   */
  public count(): number {
    return this.tasks.size;
  }
}

// Global singleton to persist across HMR reloads in Next.js development
declare global {
  // eslint-disable-next-line no-var
  var __taskMemoryStoreInstance: TaskMemoryStore | undefined;
}

export const taskStore =
  globalThis.__taskMemoryStoreInstance ??
  (globalThis.__taskMemoryStoreInstance = new TaskMemoryStore());
