import { router } from "../trpc";
import { tarefasRouter } from "./tarefas";

/**
 * Router raiz da aplicação que consolida todos os sub-roteadores.
 */
export const appRouter = router({
  tarefas: tarefasRouter,
});

export type AppRouter = typeof appRouter;
