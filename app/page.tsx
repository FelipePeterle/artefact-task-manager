import React from "react";
import { createServerCaller } from "@/trpc/server";
import { TaskList } from "@/components/TaskList";
import { Sparkles } from "lucide-react";

// Força Server-Side Rendering dinâmico a cada requisição conforme exigido no case
export const dynamic = "force-dynamic";

export default async function HomePage() {
  /**
   * REQUISITO DO DESAFIO: "Utilize Server-Side Rendering (SSR) para pré-carregar a lista de tarefas."
   * O caller server-side executa diretamente no processo do servidor Next.js,
   * obtendo os dados iniciais do repositório em memória e gerando o HTML completo
   * antes de enviar ao cliente.
   */
  const caller = await createServerCaller();
  const initialData = await caller.tarefas.listarInfinito({ limit: 6 });

  return (
    <div className="space-y-6">
      {/* Banner de Apresentação */}
      <section className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-500/10">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold backdrop-blur-sm mb-3">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>Server-Side Rendered (SSR) &amp; Infinite Scroll</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Gerenciamento de Tarefas de Produtividade
          </h1>
          <p className="mt-2 text-sm sm:text-base text-blue-100 leading-relaxed">
            Aplicação desenvolvida para o desafio da Artefact. O backend em memória
            é exposto via tRPC e o frontend utiliza SSR para entrega instantânea e
            hidratação progressiva.
          </p>
        </div>
      </section>

      {/* Componente de Listagem com Infinite Scroll */}
      <TaskList initialData={initialData} />
    </div>
  );
}
