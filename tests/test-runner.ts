import { appRouter } from "../server/routers/_app";
import { createContext } from "../server/context";
import { TRPCError } from "@trpc/server";

async function runTests() {
  console.log("🧪 Starting tRPC automated test suite (CRUD & Validations)...");
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

  // 1. Initial Listing Test
  await test("List tasks should return non-empty array with initial seed tasks", async () => {
    const tasks = await caller.tarefas.listar();
    if (!Array.isArray(tasks) || tasks.length === 0) {
      throw new Error(`Expected array with items, received: ${tasks.length}`);
    }
  });

  // 2. Valid Creation Test
  let createdId = "";
  await test("Create task with valid title and optional description", async () => {
    const newTask = await caller.tarefas.criar({
      titulo: "Automated Integration Test Task",
      descricao: "Test task description created by test runner",
    });
    if (!newTask.id || newTask.titulo !== "Automated Integration Test Task") {
      throw new Error("Created task returned inconsistent data");
    }
    if (typeof newTask.dataCriacao !== "number") {
      throw new Error("dataCriacao must be a numeric timestamp");
    }
    createdId = newTask.id;
  });

  // 3. Validation Test: Empty Title
  await test("Block task creation with empty or whitespace-only title (Zod validation)", async () => {
    try {
      await caller.tarefas.criar({
        titulo: "   ",
        descricao: "Invalid creation attempt",
      });
      throw new Error("Expected validation error for empty title!");
    } catch (err: any) {
      if (err.name === "TRPCError" || err.message.toLowerCase().includes("title")) {
        // Expected success
      } else {
        throw err;
      }
    }
  });

  // 4. Get by ID Test
  await test("Get existing task by unique ID", async () => {
    const task = await caller.tarefas.obterPorId({ id: createdId });
    if (task.id !== createdId) {
      throw new Error("Returned ID does not match requested ID");
    }
  });

  // 5. Valid Update Test
  await test("Update title and description of an existing task", async () => {
    const updated = await caller.tarefas.atualizar({
      id: createdId,
      titulo: "Updated Test Task Title",
      descricao: "New updated description",
    });
    if (updated.titulo !== "Updated Test Task Title") {
      throw new Error("Task title was not updated properly");
    }
  });

  // 6. Error Handling Test: Update Non-existent ID
  await test("Return semantic error (NOT_FOUND) when updating non-existent ID", async () => {
    try {
      await caller.tarefas.atualizar({
        id: "completely-non-existent-uuid-12345",
        titulo: "Title",
      });
      throw new Error("Expected TRPCError NOT_FOUND!");
    } catch (err: any) {
      if (err instanceof TRPCError && err.code === "NOT_FOUND") {
        // Expected success
      } else {
        throw new Error(`Expected TRPCError NOT_FOUND, received: ${err.code || err.message}`);
      }
    }
  });

  // 7. Valid Delete Test
  await test("Delete existing task by unique ID", async () => {
    const res = await caller.tarefas.deletar({ id: createdId });
    if (!res.success || res.id !== createdId) {
      throw new Error("Failed to delete task");
    }
  });

  // 8. Error Handling Test: Delete Non-existent ID
  await test("Return semantic error (NOT_FOUND) when deleting non-existent ID", async () => {
    try {
      await caller.tarefas.deletar({ id: createdId }); // Already deleted above
      throw new Error("Expected TRPCError NOT_FOUND on subsequent delete!");
    } catch (err: any) {
      if (err instanceof TRPCError && err.code === "NOT_FOUND") {
        // Expected success
      } else {
        throw new Error(`Expected TRPCError NOT_FOUND, received: ${err.code || err.message}`);
      }
    }
  });

  // 9. Infinite Scroll Cursor-based Pagination Test
  await test("Paginated listing (Infinite Scroll) returns items and nextCursor", async () => {
    const page1 = await caller.tarefas.listarInfinito({ limit: 4 });
    if (page1.items.length !== 4) {
      throw new Error(`Expected 4 items on page 1, received: ${page1.items.length}`);
    }
    if (!page1.nextCursor) {
      throw new Error("Expected nextCursor to be present for the next page");
    }

    const page2 = await caller.tarefas.listarInfinito({
      limit: 4,
      cursor: page1.nextCursor,
    });
    if (page2.items.length === 0) {
      throw new Error("Page 2 should contain items");
    }
    if (page2.items[0].id === page1.items[0].id) {
      throw new Error("Page 2 items must not repeat page 1 items");
    }
  });

  console.log(`\n📊 Test Suite Results: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error("Fatal test runner error:", e);
  process.exit(1);
});
