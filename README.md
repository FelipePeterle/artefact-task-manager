# Artefact – Productivity Task Manager

> **Technical Assessment – Artefact ("AI is about people")**  
> Developed by **Felipe Peterle**

A modern Full-Stack task management application built with **Next.js (v15)**, **React 19**, **tRPC (v11)**, **TypeScript**, **Zod**, and **Tailwind CSS**. It implements volatile in-memory persistence, hybrid rendering with **Server-Side Rendering (SSR)** for instant pre-loading, strict multi-layer validation, and bonus features including **Infinite Scroll** and an end-to-end automated test suite.

---

## 📋 Challenge Requirements Matrix

| Assessment Requirement | Status | Implementation Details |
|---|---|---|
| **Next.js v15** | ✅ Completed | Built on Next.js 15.5+ utilizing the **App Router** (`app/`), native Server Components, and strict TypeScript. |
| **Backend (tRPC)** | ✅ Completed | End-to-end typed router with `@trpc/server` v11 exposed via Next.js Route Handler at `/api/trpc/[trpc]`. |
| **In-Memory Storage** | ✅ Completed | Singleton in-memory repository (`server/db/memory-store.ts`) bound to `globalThis` to preserve state across Hot Module Replacement (HMR) reloads. |
| **Task Domain Modeling** | ✅ Completed | Strict model with `id` (unique auto-generated UUID), `titulo` (mandatory title), `descricao` (optional description), and `dataCriacao` (timestamp). |
| **CRUD Operations via tRPC** | ✅ Completed | Procedures: `criar` (create), `listar` (list all), `obterPorId` (get by ID), `atualizar` (update), and `deletar` (delete). |
| **Validation & Semantic Errors** | ✅ Completed | Input validation via **Zod** blocking empty/whitespace titles; semantic error dispatching via `TRPCError` (`NOT_FOUND`, `BAD_REQUEST`). |
| **SSR Pre-loading** | ✅ Completed | The root page (`app/page.tsx`) is an async Server Component that executes the tRPC server-side caller, delivering fully rendered HTML directly on initial request. |
| **Task Creation & Editing** | ✅ Completed | Dedicated routes (`/tarefas/nova` and `/tarefas/[id]/editar`) with hook-driven functional components, real-time client validation, and defensive server error handling. |
| **Visual Feedback & UX** | ✅ Completed | Custom lightweight toast notifications (success/error/info), accessible delete confirmation modal, and loading indicators with spinners and skeletons. |
| **Bonus: Infinite Scroll** | ✅ Completed | Cursor-based incremental pagination with tRPC `useInfiniteQuery` + `IntersectionObserver` triggered automatically as the user scrolls. |
| **Bonus: Tests & Documentation** | ✅ Completed | Automated integration test suite (`npm test`) covering 100% of tRPC procedures, alongside clean inline architecture comments. |

---

## 🛠️ Technology Stack

- **Web Framework:** [Next.js 15](https://nextjs.org/) (App Router, Server Components & Dynamic SSR)
- **UI Library:** [React 19](https://react.dev/)
- **API & RPC:** [tRPC v11](https://trpc.io/) (`@trpc/server`, `@trpc/client`, `@trpc/react-query`)
- **State Management & Caching:** [TanStack React Query v5](https://tanstack.com/query)
- **Schema Validation:** [Zod](https://zod.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Language & Types:** TypeScript 5.7+
- **Test Runner:** TSX for standalone automated execution of integration assertions

---

## 🏛️ Architecture & Engineering Decisions

### 1. Server-Side Rendering (SSR) in App Router
To fulfill the requirement of pre-loading tasks via SSR, we adopted the tRPC **Server Caller** pattern (`createServerCaller()` in `trpc/server.ts`). Inside `app/page.tsx` (a Server Component), the server directly invokes the `listarInfinito` procedure in-memory during the incoming HTTP request.

The resulting HTML delivered to the browser already contains the initial tasks rendered within the markup, guaranteeing fast First Contentful Paint (FCP) and optimal SEO. Upon client hydration, the `TaskList` component receives this data through React Query's `initialData`, avoiding redundant round-trips.

### 2. In-Memory Repository Resilient to HMR
Because persistence must be in-memory without an external database, we designed `TaskMemoryStore` (`server/db/memory-store.ts`). In Next.js development mode, file changes can re-evaluate modules. To prevent data loss while testing, the repository instance is cached on `globalThis.__taskMemoryStoreInstance`.

The store is pre-seeded with realistic productivity tasks so evaluators can immediately experience the listing and Infinite Scroll features without manual setup.

### 3. Cursor-Based Pagination for Infinite Scroll
To deliver a robust Infinite Scroll experience:
- The `listarInfinito` procedure accepts `{ limit, cursor }`.
- The repository calculates offsets using the task ID as cursor and returns `{ items, nextCursor, total }`.
- In the client, an `IntersectionObserver` watches a sentinel element at the end of the list and triggers `fetchNextPage()` automatically as the user scrolls.

### 4. Dual-Layer Validation (Frontend + Backend)
- **Frontend:** Real-time feedback on input blur and change, preventing submission when the title is empty or only whitespace.
- **Backend:** tRPC validates inputs at the boundary using Zod schemas (`createTaskSchema`, `updateTaskSchema`). If an invalid payload bypasses client validation, tRPC intercepts it before execution, returning structured validation issues.
- **Exception Handling:** Operations on non-existent tasks throw `TRPCError({ code: "NOT_FOUND" })`, presented to the user through clear feedback banners and toasts.

---

## 📂 Project Directory Structure

```
.
├── app/
│   ├── api/trpc/[trpc]/route.ts  # tRPC Route Handler in App Router
│   ├── tarefas/
│   │   ├── nova/page.tsx         # New Task creation page
│   │   └── [id]/editar/page.tsx  # Task edit page with SSR data fetching
│   ├── globals.css               # Global Tailwind CSS styles
│   ├── layout.tsx                # Root layout with Providers (tRPC + Toasts)
│   └── page.tsx                  # Home page with SSR pre-load
├── components/
│   ├── DeleteModal.tsx           # Accessible confirmation modal for task deletion
│   ├── Header.tsx                # Navigation bar and status indicators
│   ├── TaskCard.tsx              # Individual task card with actions
│   ├── TaskForm.tsx              # Reusable functional form (Create/Edit)
│   ├── TaskList.tsx              # Reactive list with search and Infinite Scroll
│   └── Toast.tsx                 # Zero-dependency toast notification system
├── server/
│   ├── context.ts                # tRPC context generator
│   ├── db/
│   │   └── memory-store.ts       # Singleton in-memory task repository
│   ├── routers/
│   │   ├── _app.ts               # Root application tRPC router
│   │   └── tarefas.ts            # Task CRUD procedures
│   ├── schemas/
│   │   └── task.schema.ts        # Zod validation schemas
│   └── trpc.ts                   # tRPC v11 core initialization
├── trpc/
│   ├── client.ts                 # Typed tRPC hooks for Client Components
│   ├── server.ts                 # Server caller for Server Components (SSR)
│   └── Provider.tsx              # Unified React Query + tRPC Provider
├── tests/
│   └── test-runner.ts            # Automated integration test suite
└── package.json
```

---

## 🚀 How to Run the Project

### Prerequisites
- **Node.js**: v18.18+ (v20+ or v22+ recommended)
- **NPM**: v9+ or v10+

### Steps

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run automated test suite:**
   ```bash
   npm test
   ```
   *Executes 9 automated assertions verifying task listing, valid creation, empty title blocking, lookup by ID, updates, deletions, semantic NOT_FOUND error codes, and cursor pagination.*

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open your browser at: [http://localhost:3000](http://localhost:3000)

4. **Production Build (Optional):**
   ```bash
   npm run build
   npm run start
   ```

---

## 🧪 Evaluation & Verification Guide

To test each requirement from the assessment:

1. **Verify Server-Side Rendering (SSR):**
   - Navigate to `http://localhost:3000`.
   - Right-click and choose **"View Page Source"** (Ctrl+U / Cmd+U).
   - Notice that the task cards and titles are already printed directly inside the raw server-rendered HTML.
2. **Task Creation & Validation:**
   - Click on **"New Task"**.
   - Attempt to submit with an empty title. The form prevents submission and displays an inline validation message: *"Task title is required and cannot be empty or only whitespace."*
   - Enter a valid title and optional description, then click **"Create Task"**.
   - You will be redirected to the homepage with a green success toast and the new task at the top of the list.
3. **Task Editing:**
   - On any task card, click the **"Edit"** button.
   - The form opens pre-populated with existing data. Modify fields and click **"Save Changes"**.
   - The updated task is instantly reflected with success feedback.
4. **Deletion with Visual Feedback:**
   - On any task card, click the **"Delete"** button.
   - An accessible confirmation modal appears. Click **"Confirm Delete"** to observe the loading spinner, immediate DOM removal, and a success toast notification.
5. **Infinite Scroll (Bonus):**
   - On the homepage, scroll down toward the bottom of the list.
   - Once the sentinel enters the viewport, the indicator *"Loading more tasks (Infinite Scroll)..."* briefly displays and the next batch of tasks is appended automatically without page refresh.
6. **Real-time Search Filter:**
   - Use the search bar at the top to filter tasks instantly by title or description.

---

## 🔒 Security & Privacy Notice

- This repository **does not contain any API keys, credentials, personal information, or proprietary secrets**.
- All sample tasks and data are purely fictional and intended solely for technical evaluation.
