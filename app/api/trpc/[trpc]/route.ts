import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/routers/_app";
import { createContext } from "@/server/context";

/**
 * Route Handler do tRPC no App Router do Next.js 15.
 * Intercepta chamadas GET e POST em /api/trpc/*
 */
const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createContext(),
    onError:
      process.env.NODE_ENV === "development"
        ? ({ path, error }) => {
            console.error(
              `❌ [tRPC Erro] Falha na procedure "${path}": ${error.message}`
            );
          }
        : undefined,
  });

export { handler as GET, handler as POST };
