import { Task, CreateTaskInput, UpdateTaskInput } from "../schemas/task.schema";
import { randomUUID } from "node:crypto";

/**
 * Repositório em memória para persistência volátil das tarefas.
 * Utiliza o objeto globalThis para preservar os dados em memória durante
 * recarregamentos a quente (HMR) no ambiente de desenvolvimento do Next.js.
 */
class TaskMemoryStore {
  private tasks: Map<string, Task> = new Map();

  constructor() {
    this.seedInitialData();
  }

  /**
   * Inicializa dados de exemplo para demonstrar o sistema,
   * permitindo validar a listagem inicial SSR e o Infinite Scroll de imediato.
   */
  private seedInitialData() {
    const now = Date.now();
    const initialTasks: Array<Omit<Task, "id">> = [
      {
        titulo: "Planejar arquitetura de software de produtividade",
        descricao: "Estruturar separação de camadas entre Next.js 15, rotas tRPC e store em memória.",
        dataCriacao: now - 1000 * 60 * 60 * 24, // 24h atrás
      },
      {
        titulo: "Arquitetar modelo de domínio das tarefas",
        descricao: "Definir tipagens estritas TypeScript e esquemas de validação de dados com Zod.",
        dataCriacao: now - 1000 * 60 * 60 * 18,
      },
      {
        titulo: "Configurar Next.js 15 com App Router e tRPC",
        descricao: "Integrar tRPC v11 com Server-Side Rendering e TanStack React Query.",
        dataCriacao: now - 1000 * 60 * 60 * 12,
      },
      {
        titulo: "Implementar operações CRUD no backend tRPC",
        descricao: "Endpoints para criar, listar, atualizar e deletar tarefas com validação Zod.",
        dataCriacao: now - 1000 * 60 * 60 * 8,
      },
      {
        titulo: "Desenvolver página de listagem com SSR e feedback visual",
        descricao: "Exibir tarefas pré-carregadas no servidor com layout limpo e ação de exclusão com toasts.",
        dataCriacao: now - 1000 * 60 * 60 * 5,
      },
      {
        titulo: "Criar telas de criação e edição com validação de formulário",
        descricao: "Formulários controlados com tratamento de erros tanto no frontend quanto no backend.",
        dataCriacao: now - 1000 * 60 * 60 * 3,
      },
      {
        titulo: "Implementar bônus: Infinite Scroll com IntersectionObserver",
        descricao: "Carregamento incremental de tarefas ao atingir o fim da página de listagem.",
        dataCriacao: now - 1000 * 60 * 60 * 2,
      },
      {
        titulo: "Adicionar tratamento global de erros e feedback amigável",
        descricao: "Garantir feedback de estados de loading, mensagens de sucesso e erros com TRPCError.",
        dataCriacao: now - 1000 * 60 * 50,
      },
      {
        titulo: "Elaborar documentação completa no README.md",
        descricao: "Descrever decisões de arquitetura, padrões utilizados e instruções passo a passo para execução.",
        dataCriacao: now - 1000 * 60 * 30,
      },
      {
        titulo: "Validar compilação e tipagem estrita TypeScript",
        descricao: "Executar build de produção para assegurar que não haja nenhuma regressão de tipos.",
        dataCriacao: now - 1000 * 60 * 15,
      },
      {
        titulo: "Executar bateria de testes automatizados dos endpoints",
        descricao: "Assegurar cobertura de integração das operações de CRUD e paginação do tRPC.",
        dataCriacao: now - 1000 * 60 * 5,
      },
    ];

    // Ordenadas por data decrescente
    for (const item of initialTasks) {
      const id = randomUUID();
      this.tasks.set(id, { id, ...item });
    }
  }

  /**
   * Retorna todas as tarefas ordenadas da mais recente para a mais antiga.
   */
  public getAll(): Task[] {
    return Array.from(this.tasks.values()).sort(
      (a, b) => b.dataCriacao - a.dataCriacao
    );
  }

  /**
   * Busca uma tarefa pelo ID único.
   */
  public getById(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  /**
   * Paginação baseada em cursor para Infinite Scroll:
   * Retorna 'limit' itens e o 'nextCursor' se houverem mais tarefas.
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
   * Cria e armazena uma nova tarefa com id gerado automaticamente.
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
   * Atualiza os campos de uma tarefa existente.
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
   * Remove uma tarefa da memória.
   */
  public delete(id: string): boolean {
    return this.tasks.delete(id);
  }

  /**
   * Retorna a quantidade total de tarefas cadastradas.
   */
  public count(): number {
    return this.tasks.size;
  }
}

// Singleton global para resistir a reloads no Next.js Dev Mode
declare global {
  // eslint-disable-next-line no-var
  var __taskMemoryStoreInstance: TaskMemoryStore | undefined;
}

export const taskStore =
  globalThis.__taskMemoryStoreInstance ??
  (globalThis.__taskMemoryStoreInstance = new TaskMemoryStore());
