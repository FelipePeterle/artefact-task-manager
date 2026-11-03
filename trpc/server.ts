import { appRouter } from "@/server/routers/_app";
import { createContext } from "@/server/context";

/**
 * Caller server-side do tRPC para pré-carregamento SSR em Server Components.
 * Executa as procedures diretamente em memória no servidor Next.js sem overhead HTTP.
 */
export async function createServerCaller() {
  const ctx = await createContext();
  return appRouter.createCaller(ctx);
}
