---
type: doc
name: development-workflow
description: Day-to-day development workflow, commands, and conventions
category: workflow
generated: 2026-06-12
status: filled
scaffoldVersion: "2.0.0"
---

# Development Workflow

## Comandos Essenciais

| Comando | Uso |
|---------|-----|
| `npm run dev` | Servidor de desenvolvimento (Next.js) |
| `npm run lint` | ESLint com `--max-warnings 0` (zero warnings tolerados) |
| `npm run typecheck` | `tsc --noEmit` (TypeScript strict) |
| `npm test` | Vitest em modo watch |
| `npm run test:run` | Vitest single run |
| `npx vitest path/to/file.test.ts` | Rodar um único arquivo de teste |
| `npm run build` | Build de produção Next.js |
| `npm run precheck` | lint + typecheck + test:run + build (gate completo) |
| `npm run precheck:fast` | lint + typecheck + test:run (sem build) |
| `npm run stories` | Roda testes de stories (`test/stories`) |
| `npm run smoke:integrations` | Smoke test de integrações (`scripts/smoke-integrations.mjs`) |

## Fluxo Recomendado

1. Criar branch a partir de `main`.
2. Desenvolver com `npm run dev`; testes co-localizados (`.test.ts(x)` ao lado do código).
3. Antes de commitar: `npm run precheck:fast`. Antes de PR/merge: `npm run precheck`.
4. Migrações de banco vão em `supabase/migrations/`.

## Convenções de Código

- **Imports**: sempre alias `@/` (ex: `@/lib/utils`, `@/components/ui`).
- **Naming**: camelCase para variáveis/funções, PascalCase para componentes/types.
- **Componentes**: compartilhados em `components/`; específicos de domínio em `features/<domínio>/`.
- **Validação**: schemas Zod em `lib/validations/`.
- **Estado servidor**: TanStack Query via facades em `context/`; chaves em `lib/query/queryKeys.ts`.
- **Estado local/UI**: Zustand em `lib/stores/` quando necessário.

## Regras de Cache (CRÍTICO)

- Um cache por entidade: CRUD, Realtime e optimistic updates usam o MESMO cache.
- **Deals**: sempre `[...queryKeys.deals.lists(), 'view']` para todas as mutações.
- **Demais entidades**: `queryKeys.{entity}.lists()`.
- NUNCA usar `queryKeys.*.list({ filter })` para optimistic updates (são caches separados).
- Preferir `setQueryData` a `invalidateQueries` para UI instantânea.

## Onde Mexer Para Cada Tipo de Mudança

| Mudança | Locais típicos |
|---------|----------------|
| Nova feature de UI | `features/<domínio>/` + rota em `app/(protected)/` |
| Nova entidade de dados | `supabase/migrations/` + `lib/supabase/<entidade>.ts` + `lib/query/queryKeys.ts` + facade em `context/` |
| Nova tool de IA | `lib/ai/tools.ts` (sempre filtrar por `organization_id`) + prompts em `lib/ai/prompts/` |
| Novo endpoint público | `app/api/public/` + `lib/public-api/` + atualizar `docs/public-api.md` |
| Webhook | `app/api/` + `docs/webhooks.md` |

## Related Resources

- [Architecture Notes](./architecture.md)
- [Testing Strategy](./testing-strategy.md)
- [Tooling](./tooling.md)
- `AGENTS.md` na raiz (regras canônicas do repositório)
