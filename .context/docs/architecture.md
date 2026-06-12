---
type: doc
name: architecture
description: System architecture, layers, patterns, and design decisions
category: architecture
generated: 2026-06-12
status: filled
scaffoldVersion: "2.0.0"
---

# Architecture Notes

NossoCRM é um monolito Next.js 16 (App Router) com backend serverless via API Routes e Supabase (Auth + Postgres + RLS) como camada de dados. O design prioriza isolamento multi-tenant por `organization_id`, cache cliente com TanStack Query (padrão Single Source of Truth) e um assistente de IA integrado via AI SDK v6.

## System Architecture Overview

- **Topologia**: aplicação única Next.js, deploy na Vercel. Não há microserviços.
- **Fluxo de requisição**: `proxy.ts` + `lib/supabase/middleware.ts` interceptam rotas de página para autenticação Supabase (rotas `/api/*` são excluídas do proxy). Páginas protegidas vivem em `app/(protected)/`.
- **Dados**: Supabase Postgres com Row Level Security. Todo acesso a dados filtra por `organization_id`.
- **IA**: chat via `app/api/ai/chat`, agente em `lib/ai/crmAgent.ts`, tools em `lib/ai/tools.ts` (sempre filtradas por `organization_id`).
- **Estado do cliente**: TanStack Query com facades em `context/` (ex: `CRMContext.tsx`, `AIContext.tsx`), queries em `lib/query/`.

## Architectural Layers

- **Rotas/Páginas**: `app/` — App Router; rotas protegidas em `app/(protected)/` (dashboard, deals, pipeline, contacts, inbox, reports, settings, ai, labs); públicas: `app/login`, `app/join`, `app/install`.
- **API**: `app/api/` — `ai/`, `chat/`, `contacts/`, `admin/`, `installer/`, `invites/`, `mcp/`, `public/` (API pública), `settings/`, `setup-instance/`.
- **Feature modules**: `features/` — UI e lógica por domínio (activities, ai-hub, boards, contacts, dashboard, deals, decisions, inbox, profile, reports, settings).
- **Componentes compartilhados**: `components/` — primitivas UI (Radix + Tailwind v4).
- **Estado/Facades**: `context/` — `AuthContext`, `CRMContext`, `AIContext`, `AIChatContext`, `ThemeContext`, `ToastContext` + facades por entidade (activities, boards, contacts, deals, settings).
- **Data access**: `lib/supabase/` — um módulo por entidade (`deals.ts`, `contacts.ts`, `activities.ts`, `boards.ts`, etc.) + clients (`client.ts`, `server.ts`, `staticAdminClient.ts`).
- **Query layer**: `lib/query/` — `queryKeys.ts`, `createQueryKeys.ts`, hooks.
- **IA**: `lib/ai/` — `crmAgent.ts`, `tools.ts`, `provider.ts`, `prompts/`, `tasks/`, `features/`.
- **Infra utilitária**: `lib/security`, `lib/validations` (Zod), `lib/realtime`, `lib/mcp`, `lib/public-api`, `lib/installer`, `lib/stores` (Zustand).
- **Banco**: `supabase/` — `migrations/`, `functions/`, `config.toml`, `reset.sql`.

> Use `context({ action: "getMap", section: "all" })` para resumos gerados de arquitetura e dependências.

## Detected Design Patterns

| Pattern | Confidence | Locations | Description |
|---------|------------|-----------|-------------|
| Facade | Alta | `context/CRMContext.tsx`, `context/deals/`, `context/contacts/` | Facades sobre TanStack Query expõem operações por entidade para a UI |
| Repository | Alta | `lib/supabase/*.ts` | Um módulo de acesso a dados por entidade encapsulando o client Supabase |
| Single Source of Truth (cache) | Alta | `lib/query/queryKeys.ts` | Um cache por entidade; deals usam `[...queryKeys.deals.lists(), 'view']` para todas as mutações |
| Provider/Factory | Alta | `lib/ai/provider.ts` | Seleção de provedor de IA (Anthropic/OpenAI/Google) via AI SDK v6 |
| Tool-calling Agent | Alta | `lib/ai/crmAgent.ts`, `lib/ai/tools.ts` | Agente de IA com tools tipadas, todas filtradas por `organization_id` |
| Feature Modules | Alta | `features/*` | Domínios isolados com componentes e lógica própria |

## Entry Points

- [app/layout.tsx](../../app/layout.tsx) — layout raiz e providers globais
- [app/(protected)/layout.tsx](../../app/(protected)/layout.tsx) — shell autenticado
- [proxy.ts](../../proxy.ts) — autenticação de proxy (substitui middleware.ts)
- [app/api/ai/chat](../../app/api/ai/chat) — endpoint do chat de IA
- [app/install](../../app/install) — wizard de instalação
- [app/api/public](../../app/api/public) — API pública (ver `docs/public-api.md`)

## Public API

| Symbol | Type | Location |
|--------|------|----------|
| `queryKeys` | objeto de chaves de cache | `lib/query/queryKeys.ts` |
| Facades de entidade | React contexts/hooks | `context/index.ts` |
| Clients Supabase | `createClient` (browser/server/service-role) | `lib/supabase/client.ts`, `server.ts`, `staticAdminClient.ts` |
| Tools de IA | tool definitions (AI SDK v6) | `lib/ai/tools.ts` |
| Schemas Zod | validação | `lib/validations/` |
| REST pública | endpoints versionados | `app/api/public/`, `lib/public-api/` |

## Internal System Boundaries

- **Multi-tenancy**: limite mais importante. RLS no Postgres + filtro explícito de `organization_id` em tools de IA e API pública. Testes dedicados: `test/tools.multiTenant.test.ts`, `test/aiToolsRbac.test.ts`.
- **Proxy vs API**: `proxy.ts` cobre apenas páginas; rotas `/api/*` fazem sua própria autenticação.
- **Cache**: mutações nunca usam `queryKeys.*.list({ filter })` (caches separados); sempre o cache canônico da entidade.

## External Service Dependencies

- **Supabase**: Auth, Postgres, RLS, Edge Functions (`supabase/functions/`).
- **Provedores de IA**: Anthropic, OpenAI, Google via `@ai-sdk/*` v3 / `ai` v6.
- **Vercel**: hospedagem e deploy (fluxo Fork → Vercel → `/install`).
- **Webhooks**: integrações Hotmart, n8n, Make (ver `docs/webhooks.md`).
- **MCP**: servidor MCP exposto em `app/api/mcp` (ver `docs/mcp.md`).

## Key Decisions & Trade-offs

- `proxy.ts` em vez de `middleware.ts` para autenticação, excluindo `/api/*` — permite que APIs públicas e webhooks gerenciem auth própria.
- Cache única por entidade (`setQueryData` preferido a `invalidateQueries`) — atualizações instantâneas de UI ao custo de disciplina rígida nas mutações.
- Instalação self-service via wizard `/install` — usuários não técnicos conseguem fazer deploy sem tocar em código.

## Top Directories Snapshot

- `app/` — rotas, layouts e API routes (~10 grupos de rotas protegidas, ~10 grupos de API)
- `features/` — 11 módulos de domínio
- `lib/` — ~20 submódulos (supabase, ai, query, security, validations, mcp, public-api, ...)
- `context/` — 6 contexts globais + facades por entidade
- `components/` — componentes compartilhados
- `supabase/` — migrações e funções do banco
- `test/` — setup de testes e suites de integração/segurança

## Related Resources

- [Project Overview](./project-overview.md)
- [Security](./security.md)
- [Testing Strategy](./testing-strategy.md)
- [Development Workflow](./development-workflow.md)
- `docs/mcp.md`, `docs/public-api.md`, `docs/webhooks.md` (docs do produto)
