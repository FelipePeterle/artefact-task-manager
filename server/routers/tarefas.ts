import { router, publicProcedure, TRPCError } from "../trpc";
import { taskStore } from "../db/memory-store";
import {
  createTaskSchema,
  updateTaskSchema,
  taskIdSchema,
  listTasksInputSchema,
} from "../schemas/task.schema";

/**
 * Task router handling complete CRUD operations via tRPC.
 * Enforces strict Zod validation and semantic TRPCErrors.
 */
export const tarefasRouter = router({
  /**
   * List all tasks currently in memory.
   */
  listar: publicProcedure.query(() => {
    return taskStore.getAll();
  }),

  /**
   * List tasks with cursor-based pagination for Infinite Scroll.
   * Bonus feature: incrementally loads batches as the user scrolls.
   */
  listarInfinito: publicProcedure
    .input(listTasksInputSchema)
    .query(({ input }) => {
      const { limit, cursor } = input;
      return taskStore.getPaginated(limit, cursor);
    }),

  /**
   * Get task details by ID.
   * Used for pre-filling the edit form.
   */
  obterPorId: publicProcedure.input(taskIdSchema).query(({ input }) => {
    const task = taskStore.getById(input.id);
    if (!task) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Task with ID "${input.id}" was not found.`,
      });
    }
    return task;
  }),

  /**
   * Create a new task.
   * Validates title presence via Zod and automatically generates UUID and timestamp.
   */
  criar: publicProcedure
    .input(createTaskSchema)
    .mutation(({ input }) => {
      const novaTarefa = taskStore.create(input);
      return novaTarefa;
    }),

  /**
   * Update an existing task.
   * Throws TRPCError with NOT_FOUND if the task does not exist.
   */
  atualizar: publicProcedure
    .input(updateTaskSchema)
    .mutation(({ input }) => {
      const tarefaAtualizada = taskStore.update(input);
      if (!tarefaAtualizada) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Unable to update: task with ID "${input.id}" was not found.`,
        });
      }
      return tarefaAtualizada;
    }),

  /**
   * Delete a task by ID.
   * Throws TRPCError with NOT_FOUND if the task does not exist.
   */
  deletar: publicProcedure
    .input(taskIdSchema)
    .mutation(({ input }) => {
      const existe = taskStore.getById(input.id);
      if (!existe) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Unable to delete: task with ID "${input.id}" was not found.`,
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
