# Artefact – Gerenciador de Tarefas de Produtividade

> **Desafio Prático – Processo Seletivo Artefact ("AI is about people")**  
> Desenvolvido por **Felipe Peterle**

Aplicação Full-Stack moderna de gerenciamento de tarefas construída com **Next.js (v15)**, **React 19**, **tRPC (v11)**, **TypeScript**, **Zod** e **Tailwind CSS**. Implementa persistência em memória, renderização híbrida com **Server-Side Rendering (SSR)** para pré-carregamento imediato, validação estrita em todas as camadas e os recursos bônus de **Infinite Scroll** e documentação técnica aprofundada com testes automatizados.

---

## 📋 Sumário de Atendimento aos Requisitos

| Requisito do Desafio | Status | Detalhes da Implementação |
|---|---|---|
| **Next.js v15** | ✅ Concluído | Utiliza Next.js 15.5+ com **App Router** (`app/`), Server Components nativos e TypeScript estrito. |
| **Backend tRPC** | ✅ Concluído | Router tipado end-to-end com `@trpc/server` v11 exposto em `/api/trpc/[trpc]`. |
| **Armazenamento em Memória** | ✅ Concluído | Repositório singleton volátil (`server/db/memory-store.ts`) ancorado no `globalThis` para resistir a reloads no Dev Mode. |
| **Modelagem da Tarefa** | ✅ Concluído | `id` (UUID único gerado automaticamente), `titulo` (obrigatório), `descricao` (opcional), `dataCriacao` (timestamp). |
| **Operações CRUD via tRPC** | ✅ Concluído | Procedures: `criar`, `listar`, `obterPorId`, `atualizar` e `deletar`. |
| **Validação e Erros Significativos** | ✅ Concluído | Validação com schemas **Zod** bloqueando títulos vazios e retornos semânticos com `TRPCError` (`NOT_FOUND`, `BAD_REQUEST`). |
| **Listagem com SSR** | ✅ Concluído | A página raiz (`app/page.tsx`) é um Server Component que executa o caller do tRPC no servidor e entrega o HTML completo já pré-carregado. |
| **Criação e Edição de Tarefas** | ✅ Concluído | Rotas dedicadas (`/tarefas/nova` e `/tarefas/[id]/editar`) com formulários controlados por hooks funcionais, validação em tempo real e bloqueio de envio inválido. |
| **Feedback Visual e UX** | ✅ Concluído | Sistema de Toasts customizados (sucesso/erro/info), modal acessível de confirmação para exclusão e loading states com spinners e skeletons. |
| **Bônus: Infinite Scroll** | ✅ Concluído | Paginação incremental baseada em cursor via `useInfiniteQuery` do tRPC + `IntersectionObserver` disparado conforme o scroll da página. |
| **Bônus: Documentação & Testes** | ✅ Concluído | Suíte de testes automatizados com `npm test` cobrindo 100% dos endpoints do tRPC e este `README.md`. |

---

## 🛠️ Tecnologias Utilizadas

- **Framework Web:** [Next.js 15](https://nextjs.org/) (App Router, Server Components & Dynamic SSR)
- **Biblioteca de Interface:** [React 19](https://react.dev/)
- **API & RPC:** [tRPC v11](https://trpc.io/) (`@trpc/server`, `@trpc/client`, `@trpc/react-query`)
- **Gerenciamento de Estado & Cache Assíncrono:** [TanStack React Query v5](https://tanstack.com/query)
- **Validação de Esquemas:** [Zod](https://zod.dev/)
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/)
- **Ícones:** [Lucide React](https://lucide.dev/)
- **Linguagem & Tipagem:** TypeScript 5.7+
- **Testes:** TSX Runner para asserções automatizadas de integração dos endpoints tRPC

---

## 🏛️ Decisões de Arquitetura e Engenharia

### 1. Pré-carregamento Server-Side Rendering (SSR) no App Router
Para atender à diretriz de pré-carregamento por SSR, utilizamos o padrão **Server Caller** do tRPC (`createServerCaller()` em `trpc/server.ts`). Na rota `app/page.tsx` (um Server Component), o servidor executa a procedure `listarInfinito` diretamente em memória durante a requisição HTTP. 

O HTML enviado ao navegador já contém as tarefas iniciais pré-renderizadas (assegurando FCP instantâneo e SEO perfeito). Quando o bundle JavaScript é hidratado no cliente, o componente `TaskList` recebe esse estado via `initialData` do TanStack Query, garantindo continuidade suave sem refetches desnecessários.

### 2. Repositório em Memória Persistente ao HMR
Para armazenar as tarefas sem banco de dados, criamos a classe `TaskMemoryStore` (`server/db/memory-store.ts`). Em ambiente de desenvolvimento Next.js, módulos podem ser reavaliados a cada alteração de código (Hot Module Replacement). Para evitar a perda dos dados durante a navegação do avaliador, a instância do repositório é indexada no `globalThis.__taskMemoryStoreInstance`.

Além disso, o repositório já é inicializado com tarefas fictícias de demonstração com timestamps realistas, permitindo que o avaliador teste a listagem e o Infinite Scroll imediatamente ao abrir a aplicação.

### 3. Paginação com Cursor para o Infinite Scroll
Para implementar o bônus de Infinite Scroll de maneira profissional e escalável:
- O endpoint `listarInfinito` recebe `{ limit, cursor }`.
- O repositório calcula o deslocamento pelo cursor (ID da última tarefa recebida) e retorna `{ items, nextCursor, total }`.
- No cliente, um `IntersectionObserver` monitora uma div sentinela no fim da lista e aciona `fetchNextPage()` automaticamente à medida que o usuário rola a página.

### 4. Validação em Dupla Camada (Frontend + Backend)
- **No Frontend:** Validação em tempo real conforme o usuário digita (`onBlur` e `onChange`), impedindo a submissão se o título estiver em branco ou for composto exclusivamente por espaços.
- **No Backend:** O tRPC valida o payload na borda através de esquemas Zod (`createTaskSchema` e `updateTaskSchema`). Se uma requisição for forçada sem título, o tRPC intercepta e rejeita a requisição antes que ela atinja o repositório, disparando um erro tipado.
- **Tratamento de Exceções:** Casos como atualização ou exclusão de tarefas inexistentes disparam explicitamente um `TRPCError({ code: "NOT_FOUND" })`, exposto de maneira amigável nos componentes visuais.

---

## 📂 Estrutura de Diretórios

```
.
├── app/
│   ├── api/trpc/[trpc]/route.ts  # Route Handler do tRPC no App Router
│   ├── tarefas/
│   │   ├── nova/page.tsx         # Página de criação de nova tarefa
│   │   └── [id]/editar/page.tsx  # Página de edição com SSR por ID
│   ├── globals.css               # Estilos globais Tailwind CSS
│   ├── layout.tsx                # Root Layout com Providers (tRPC + Toasts)
│   └── page.tsx                  # Página inicial com SSR prefetch
├── components/
│   ├── DeleteModal.tsx           # Modal de confirmação para exclusão
│   ├── Header.tsx                # Barra de navegação e status
│   ├── TaskCard.tsx              # Card individual de exibição da tarefa
│   ├── TaskForm.tsx              # Formulário funcional reutilizável (Criar/Editar)
│   ├── TaskList.tsx              # Lista com busca e Infinite Scroll
│   └── Toast.tsx                 # Sistema leve de notificações toast
├── server/
│   ├── context.ts                # Contexto tRPC
│   ├── db/
│   │   └── memory-store.ts       # Armazenamento em memória (In-Memory Singleton)
│   ├── routers/
│   │   ├── _app.ts               # Router raiz tRPC
│   │   └── tarefas.ts            # Router CRUD de tarefas
│   ├── schemas/
│   │   └── task.schema.ts        # Schemas Zod de validação
│   └── trpc.ts                   # Inicialização tRPC v11
├── trpc/
│   ├── client.ts                 # Cliente tRPC para Client Components
│   ├── server.ts                 # Caller tRPC para Server Components (SSR)
│   └── Provider.tsx              # Provider unificado React Query + tRPC
├── tests/
│   └── test-runner.ts            # Bateria automatizada de testes tRPC
└── package.json
```

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- **Node.js**: v18.18+ (recomendado v20+ ou v22+)
- **NPM**: v9+ ou v10+

### Passo a Passo

1. **Instalar as dependências:**
   ```bash
   npm install
   ```

2. **Executar a suíte de testes automatizados:**
   ```bash
   npm test
   ```
   *Executa 9 asserções cobrindo listagem, criação, bloqueio de títulos vazios, busca por ID, edição, exclusão, erros semânticos NOT_FOUND e paginação por cursor do infinite scroll.*

3. **Iniciar o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   Abra no seu navegador: [http://localhost:3000](http://localhost:3000)

4. **Executar o build de produção (opcional):**
   ```bash
   npm run build
   npm run start
   ```

---

## 🧪 Roteiro de Testes para Avaliação

Para validar todos os critérios solicitados no desafio:

1. **Validação do Server-Side Rendering (SSR):**
   - Acesse `http://localhost:3000`.
   - Clique com o botão direito e selecione **"Exibir código-fonte da página"** (Ctrl+U / Cmd+U).
   - Observe que os títulos e descrições das tarefas já vêm impressos diretamente no HTML bruto enviado pelo servidor, sem depender de execução prévia de JavaScript.
2. **Criação de Tarefas & Validação:**
   - Clique em **"Nova Tarefa"**.
   - Tente submeter o formulário com o campo título vazio. Note que o botão e o validador impedem o envio e exibem uma mensagem de erro visual imediata.
   - Preencha um título válido (ex: *"Minha Tarefa de Teste"*) e uma descrição opcional. Clique em **"Cadastrar Tarefa"**.
   - Você será redirecionado para a home e verá um Toast de sucesso no canto inferior direito.
3. **Edição de Tarefas:**
   - Em qualquer card da listagem, clique no botão **"Editar"**.
   - O formulário será aberto com os dados atuais pré-carregados. Altere o título ou descrição e clique em **"Salvar Alterações"**.
   - A alteração é refletida imediatamente com feedback de sucesso.
4. **Exclusão com Feedback Visual:**
   - Em qualquer card, clique no botão **"Excluir"**.
   - Um modal amigável solicitará sua confirmação. Ao clicar em **"Confirmar Exclusão"**, um spinner de carregamento será exibido temporariamente, o card será removido da tela e um Toast de confirmação será apresentado.
5. **Teste do Infinite Scroll (Bônus):**
   - Na página inicial, role a página para baixo.
   - Conforme você atinge o final da lista, o indicador visual *"Carregando mais tarefas (Infinite Scroll)..."* será exibido e o próximo lote de tarefas será inserido dinamicamente sem recarregar a tela.
6. **Teste de Busca e Filtro em Tempo Real:**
   - Utilize a barra de busca no topo para filtrar instantaneamente tarefas por qualquer termo contido no título ou na descrição.

---

## 🔒 Segurança e Dados

- Este projeto **não contém nenhuma chave de API, credencial, senha ou informação pessoal**.
- Todos os dados gerados, sementes e mensagens são puramente fictícios e voltados unicamente para a avaliação técnica.
