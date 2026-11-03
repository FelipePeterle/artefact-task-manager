import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";

/**
 * Criação do contexto para cada requisição tRPC.
 * Permite injetar headers, usuário autenticado e serviços.
 */
export async function createContext(opts?: FetchCreateContextFnOptions) {
  return {
    headers: opts?.req.headers,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
