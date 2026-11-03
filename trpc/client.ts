import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@/server/routers/_app";

/**
 * Hook tRPC tipado para uso em Client Components ("use client").
 */
export const trpc = createTRPCReact<AppRouter>();
