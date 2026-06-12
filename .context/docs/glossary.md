---
type: doc
name: glossary
description: Domain and technical terms used in this repository
category: reference
generated: 2026-06-12
status: filled
scaffoldVersion: "2.0.0"
---

# Glossary

## Termos de Domínio (CRM)

| Termo | Significado |
|-------|-------------|
| **Deal** | Oportunidade de venda; entidade central do pipeline. Código em `features/deals/`, dados em `lib/supabase/deals.ts` |
| **Pipeline** | Quadro Kanban de deals organizados por estágio. Rota `app/(protected)/pipeline` |
| **Board** | Quadro configurável de estágios; `features/boards/`, `lib/supabase/boards.ts` |
| **Contact** | Pessoa ou empresa; estágios de funil: lead, prospect, cliente. `features/contacts/` |
| **Activity** | Tarefa, reunião ou chamada vinculada a deal/contato. `features/activities/` |
| **Inbox** | Briefing diário gerado por IA com prioridades do usuário. `features/inbox/` |
| **Decisions** | Módulo de registros de decisão. `features/decisions/` |
| **Quick Script** | Script de vendas pronto/gerado por IA. `lib/supabase/quickScripts.ts` |
| **Organization** | Tenant; toda linha de dados pertence a uma `organization_id` |
| **Instance** | Instalação self-hosted do NossoCRM (fluxo `/install` + `app/api/setup-instance`) |

## Termos Técnicos

| Termo | Significado |
|-------|-------------|
| **RLS** | Row Level Security do Postgres/Supabase; garante isolamento por organização |
| **Facade** | Context React que encapsula TanStack Query por entidade (`context/deals/`, `context/contacts/`, ...) |
| **Query Keys** | Chaves canônicas de cache em `lib/query/queryKeys.ts` |
| **View cache (deals)** | Cache canônico de deals: `[...queryKeys.deals.lists(), 'view']` — usado por TODAS as mutações |
| **Proxy auth** | Autenticação via `proxy.ts` + `lib/supabase/middleware.ts` (não usa `middleware.ts` padrão); exclui `/api/*` |
| **Service-role client** | Client Supabase com privilégios elevados (`lib/supabase/staticAdminClient.ts`); apenas server-side |
| **AI Tools** | Funções expostas ao agente de IA em `lib/ai/tools.ts`; sempre filtram por `organization_id` |
| **CRM Agent** | Agente de IA do produto, `lib/ai/crmAgent.ts`, servido por `app/api/ai/chat` |
| **MCP** | Model Context Protocol; servidor exposto em `app/api/mcp` (ver `docs/mcp.md`) |
| **Public API** | API REST para integrações externas: `app/api/public/` + `lib/public-api/` (ver `docs/public-api.md`) |
| **Installer/Wizard** | Fluxo de setup em `app/install` + `lib/installer/` que configura Supabase e variáveis |
| **PREVC** | Workflow do dotcontext (Plan, Research, Execute, Verify, Commit) persistido em `.context/harness/` |

## Related Resources

- [Project Overview](./project-overview.md)
- [Architecture Notes](./architecture.md)
