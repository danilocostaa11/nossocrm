---
type: doc
name: project-overview
description: High-level overview of the project, goals, and stack
category: overview
generated: 2026-06-12
status: filled
scaffoldVersion: "2.0.0"
---

# Project Overview

## O que é

**NossoCRM** (pacote `crmia-next`) é um CRM inteligente com assistente de IA integrado. Permite gerenciar pipeline de vendas (Kanban), contatos, atividades e relatórios, com um agente de IA capaz de analisar o pipeline, criar deals, gerar scripts de vendas e produzir um briefing diário (Inbox Inteligente).

**Demo atual:** rebrand visual **YumIA** (white-label para MVP comercial). Estado completo da sessão: [session-handoff.md](./session-handoff.md).

Público-alvo: equipes de vendas; o produto é self-hostável via fluxo Fork → Deploy na Vercel → **Wizard** `/install` (provisiona Supabase, migrations, admin e redeploy em ~15–20 min).

## Stack

| Camada | Tecnologia |
|--------|------------|
| Framework | Next.js 16 (App Router), React 19, TypeScript 5 strict |
| UI | Tailwind CSS v4, Radix UI primitives, lucide-react, framer-motion, recharts |
| Dados | Supabase (Auth + Postgres + RLS), `pg` para acesso direto quando necessário |
| Estado | TanStack Query v5 (facades em `context/`), Zustand (`lib/stores/`), immer |
| IA | AI SDK v6; provedores: Google, OpenAI, Anthropic, OpenRouter, OpenCode Zen — catálogo em `lib/ai/providersCatalog.ts` (BYOK) |
| Formulários | react-hook-form + Zod (`lib/validations/`) |
| Testes | Vitest 4 + happy-dom + React Testing Library + vitest-axe |
| Deploy | Vercel |

## Capacidades Principais

- **Pipeline Kanban** com drag-and-drop, métricas em tempo real e priorização — `features/boards/`, `features/deals/`, rota `app/(protected)/pipeline`.
- **Contatos e empresas** com importação CSV/exportação — `features/contacts/`.
- **Atividades** (tarefas, reuniões, chamadas) — `features/activities/`.
- **Assistente de IA** conversacional com tools sobre o CRM — `lib/ai/`, `app/api/ai/chat`.
- **Inbox Inteligente** com briefing diário por IA — `features/inbox/`.
- **Relatórios e dashboard** — `features/reports/`, `features/dashboard/`.
- **Integrações**: webhooks (Hotmart, n8n, Make), API pública e servidor MCP — `docs/webhooks.md`, `docs/public-api.md`, `docs/mcp.md`.
- **Multi-tenant**: isolamento total por `organization_id` com RLS.

## Estrutura do Repositório

```
app/            # Rotas App Router; (protected)/ exige auth; api/ para endpoints
features/       # 11 módulos de domínio (deals, contacts, inbox, ...)
components/     # Componentes UI compartilhados
context/        # Contexts globais + facades TanStack Query por entidade
lib/            # supabase/, ai/, query/, security/, validations/, mcp/, public-api/, ...
supabase/       # migrations/, functions/, config.toml, reset.sql
test/           # setup, stories e suites de segurança/multi-tenant
docs/           # documentação do produto (mcp, public-api, webhooks)
proxy.ts        # autenticação de páginas (exclui /api/*)
AGENTS.md       # regras canônicas para agentes de IA neste repo
```

## Related Resources

- [Architecture Notes](./architecture.md)
- [Development Workflow](./development-workflow.md)
- [Security](./security.md)
- [Glossary](./glossary.md)
