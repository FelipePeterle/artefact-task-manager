import { z } from "zod";

/**
 * Esquema de modelagem da Tarefa conforme especificação do case:
 * - id: único (gerado automaticamente no backend)
 * - titulo: string, obrigatório (não pode ser vazio ou só espaços)
 * - descricao: string, opcional
 * - dataCriacao: timestamp em milissegundos
 */
export const taskSchema = z.object({
  id: z.string().uuid(),
  titulo: z.string().trim().min(1, "O título é obrigatório e não pode ser vazio."),
  descricao: z.string().optional(),
  dataCriacao: z.number().int().positive(),
});

export type Task = z.infer<typeof taskSchema>;

/**
 * Esquema para criação de nova tarefa
 */
export const createTaskSchema = z.object({
  titulo: z
    .string({
      required_error: "O título da tarefa é obrigatório.",
      invalid_type_error: "O título deve ser um texto.",
    })
    .trim()
    .min(1, "O título não pode estar vazio.")
    .max(120, "O título deve conter no máximo 120 caracteres."),
  descricao: z
    .string()
    .trim()
    .max(1000, "A descrição deve conter no máximo 1000 caracteres.")
    .optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

/**
 * Esquema para atualização de tarefa existente
 */
export const updateTaskSchema = z.object({
  id: z.string().min(1, "Identificador da tarefa é obrigatório."),
  titulo: z
    .string({
      required_error: "O título da tarefa é obrigatório.",
    })
    .trim()
    .min(1, "O título não pode estar vazio.")
    .max(120, "O título deve conter no máximo 120 caracteres."),
  descricao: z
    .string()
    .trim()
    .max(1000, "A descrição deve conter no máximo 1000 caracteres.")
    .optional(),
});

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

/**
 * Esquema para buscar ou remover por ID
 */
export const taskIdSchema = z.object({
  id: z.string().min(1, "Identificador da tarefa é obrigatório."),
});

/**
 * Esquema de paginação incremental para o Bônus de Infinite Scroll
 */
export const listTasksInputSchema = z.object({
  limit: z.number().min(1).max(50).default(6),
  cursor: z.string().nullish(), // id da última tarefa recebida como cursor
});

export type ListTasksInput = z.infer<typeof listTasksInputSchema>;
