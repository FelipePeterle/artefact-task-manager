import { router, publicProcedure, TRPCError } from "../trpc";
import { taskStore } from "../db/memory-store";
import {
  createTaskSchema,
  updateTaskSchema,
  taskIdSchema,
  listTasksInputSchema,
} from "../schemas/task.schema";

/**
 * Router de Tarefas (CRUD completo via tRPC).
 * Implementa validação estrita com Zod e tratamento semântico de erros (TRPCError).
 */
export const tarefasRouter = router({
  /**
   * Listar todas as tarefas em memória (sem paginação).
   */
  listar: publicProcedure.query(() => {
    return taskStore.getAll();
  }),

  /**
   * Listar tarefas com suporte a Infinite Scroll (cursor-based pagination).
   * Bônus do desafio: carrega lotes dinâmicos conforme o usuário rola a tela.
   */
  listarInfinito: publicProcedure
    .input(listTasksInputSchema)
    .query(({ input }) => {
      const { limit, cursor } = input;
      return taskStore.getPaginated(limit, cursor);
    }),

  /**
   * Obter os detalhes de uma tarefa pelo ID.
   * Utilizado para pré-carregar os dados no formulário de edição.
   */
  obterPorId: publicProcedure.input(taskIdSchema).query(({ input }) => {
    const task = taskStore.getById(input.id);
    if (!task) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Tarefa com ID "${input.id}" não foi encontrada.`,
      });
    }
    return task;
  }),

  /**
   * Criar nova tarefa.
   * Valida obrigatoriedade do título via schema Zod e gera ID único e data automaticamente.
   */
  criar: publicProcedure
    .input(createTaskSchema)
    .mutation(({ input }) => {
      const novaTarefa = taskStore.create(input);
      return novaTarefa;
    }),

  /**
   * Atualizar dados de uma tarefa existente.
   * Lança TRPCError com código NOT_FOUND caso a tarefa não exista.
   */
  atualizar: publicProcedure
    .input(updateTaskSchema)
    .mutation(({ input }) => {
      const tarefaAtualizada = taskStore.update(input);
      if (!tarefaAtualizada) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Não foi possível atualizar: tarefa "${input.id}" não existe.`,
        });
      }
      return tarefaAtualizada;
    }),

  /**
   * Deletar uma tarefa pelo ID.
   * Lança TRPCError com código NOT_FOUND caso a tarefa não exista.
   */
  deletar: publicProcedure
    .input(taskIdSchema)
    .mutation(({ input }) => {
      const existe = taskStore.getById(input.id);
      if (!existe) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Não foi possível remover: tarefa "${input.id}" não encontrada.`,
        });
      }

      taskStore.delete(input.id);
      return {
        success: true,
        id: input.id,
        titulo: existe.titulo,
      };
    }),
});
