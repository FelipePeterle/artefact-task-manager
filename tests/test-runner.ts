import { appRouter } from "../server/routers/_app";
import { createContext } from "../server/context";
import { TRPCError } from "@trpc/server";

async function runTests() {
  console.log("🧪 Iniciando bateria de testes do tRPC (CRUD e Validações)...");
  const ctx = await createContext();
  const caller = appRouter.createCaller(ctx);

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ❌ [FAIL] ${name}:`, err.message || err);
      failed++;
    }
  }

  // 1. Teste de Listagem Inicial
  await test("Listar tarefas deve retornar a lista com as sementes iniciais", async () => {
    const tasks = await caller.tarefas.listar();
    if (!Array.isArray(tasks) || tasks.length === 0) {
      throw new Error(`Esperado array com itens, recebido: ${tasks.length}`);
    }
  });

  // 2. Teste de Criação Válida
  let createdId = "";
  await test("Criar tarefa com título e descrição válidos", async () => {
    const newTask = await caller.tarefas.criar({
      titulo: "Tarefa de Teste Automatizado",
      descricao: "Descrição do teste automatizado",
    });
    if (!newTask.id || newTask.titulo !== "Tarefa de Teste Automatizado") {
      throw new Error("Tarefa criada com dados inconsistentes");
    }
    if (typeof newTask.dataCriacao !== "number") {
      throw new Error("dataCriacao deve ser um timestamp numérico");
    }
    createdId = newTask.id;
  });

  // 3. Teste de Validação: Título Vazio
  await test("Bloquear criação de tarefa com título vazio (validação Zod)", async () => {
    try {
      await caller.tarefas.criar({
        titulo: "   ",
        descricao: "Tentativa inválida",
      });
      throw new Error("Deveria ter falhado com título vazio!");
    } catch (err: any) {
      if (err.name === "TRPCError" || err.message.includes("título")) {
        // Sucesso esperado
      } else {
        throw err;
      }
    }
  });

  // 4. Teste de Obter por ID
  await test("Obter tarefa existente pelo ID", async () => {
    const task = await caller.tarefas.obterPorId({ id: createdId });
    if (task.id !== createdId) {
      throw new Error("ID retornado não confere");
    }
  });

  // 5. Teste de Atualização Válida
  await test("Atualizar título e descrição de tarefa existente", async () => {
    const updated = await caller.tarefas.atualizar({
      id: createdId,
      titulo: "Tarefa de Teste Atualizada",
      descricao: "Nova descrição atualizada",
    });
    if (updated.titulo !== "Tarefa de Teste Atualizada") {
      throw new Error("Título não foi atualizado corretamente");
    }
  });

  // 6. Teste de Erro: Atualizar Tarefa Inexistente
  await test("Retornar erro significativo (NOT_FOUND) ao atualizar ID inexistente", async () => {
    try {
      await caller.tarefas.atualizar({
        id: "id-totalmente-inexistente-12345",
        titulo: "Título",
      });
      throw new Error("Deveria ter lançado NOT_FOUND!");
    } catch (err: any) {
      if (err instanceof TRPCError && err.code === "NOT_FOUND") {
        // Sucesso esperado
      } else {
        throw new Error(`Esperado TRPCError NOT_FOUND, recebido: ${err.code || err.message}`);
      }
    }
  });

  // 7. Teste de Deleção Válida
  await test("Excluir tarefa existente pelo ID", async () => {
    const res = await caller.tarefas.deletar({ id: createdId });
    if (!res.success || res.id !== createdId) {
      throw new Error("Falha ao remover tarefa");
    }
  });

  // 8. Teste de Erro: Excluir Tarefa Inexistente
  await test("Retornar erro significativo (NOT_FOUND) ao excluir ID inexistente", async () => {
    try {
      await caller.tarefas.deletar({ id: createdId }); // Já foi excluída
      throw new Error("Deveria ter lançado NOT_FOUND na segunda exclusão!");
    } catch (err: any) {
      if (err instanceof TRPCError && err.code === "NOT_FOUND") {
        // Sucesso esperado
      } else {
        throw new Error(`Esperado TRPCError NOT_FOUND, recebido: ${err.code || err.message}`);
      }
    }
  });

  // 9. Teste do Infinite Scroll (Cursor Pagination)
  await test("Listagem paginada (Infinite Scroll) retorna items e nextCursor", async () => {
    const page1 = await caller.tarefas.listarInfinito({ limit: 4 });
    if (page1.items.length !== 4) {
      throw new Error(`Esperado 4 itens na página 1, recebido: ${page1.items.length}`);
    }
    if (!page1.nextCursor) {
      throw new Error("Esperado nextCursor presente para próxima página");
    }

    const page2 = await caller.tarefas.listarInfinito({
      limit: 4,
      cursor: page1.nextCursor,
    });
    if (page2.items.length === 0) {
      throw new Error("Página 2 deveria conter itens");
    }
    if (page2.items[0].id === page1.items[0].id) {
      throw new Error("Página 2 não deve repetir itens da página 1");
    }
  });

  console.log(`\n📊 Resultado dos Testes: ${passed} passaram, ${failed} falharam.\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error("Erro fatal nos testes:", e);
  process.exit(1);
});
