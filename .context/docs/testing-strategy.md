---
type: doc
name: testing-strategy
description: Test types, frameworks, conventions, and how to run tests
category: testing
generated: 2026-06-12
status: filled
scaffoldVersion: "2.0.0"
---

# Testing Strategy

## Stack de Testes

- **Runner**: Vitest 4 (`vitest.config.ts`), ambiente `happy-dom` para testes de DOM.
- **UI**: React Testing Library + `@testing-library/user-event` + `@testing-library/jest-dom`.
- **Acessibilidade**: `vitest-axe` + `axe-core`.
- **Setup**: `test/setup.ts` (geral) e `test/setup.dom.ts` (DOM).

## Comandos

| Comando | Uso |
|---------|-----|
| `npm test` | Watch mode |
| `npm run test:run` | Single run (CI) |
| `npx vitest path/to/file.test.ts` | Arquivo único |
| `npm run stories` | Suites de stories (`test/stories`) |
| `npm run precheck:fast` | lint + typecheck + testes |
| `npm run smoke:integrations` | Smoke de integrações externas |

## Convenções

- Testes co-localizados: `*.test.ts(x)` ao lado do código fonte (ex: `lib/query/__tests__/`).
- Suites transversais de segurança/integração vivem em `test/`:
  - `test/aiToolsRbac.test.ts` — RBAC das tools de IA
  - `test/tools.multiTenant.test.ts` — isolamento multi-tenant
  - `test/tools.salesTeamMatrix.test.ts` — matriz de permissões de equipe
  - `test/supabaseMiddleware.test.ts` — comportamento do middleware de auth
  - `test/publicApiCursor.test.ts`, `test/publicApiOpenapi.test.ts` — contratos da API pública
- Helpers compartilhados em `test/helpers/`.

## O que Testar ao Mudar Cada Área

| Área alterada | Testes obrigatórios |
|---------------|---------------------|
| Tools de IA (`lib/ai/tools.ts`) | `test/aiToolsRbac.test.ts`, `test/tools.multiTenant.test.ts` |
| Auth/middleware (`proxy.ts`, `lib/supabase/middleware.ts`) | `test/supabaseMiddleware.test.ts` |
| API pública (`app/api/public/`, `lib/public-api/`) | `test/publicApiCursor.test.ts`, `test/publicApiOpenapi.test.ts` |
| Cache/queries (`lib/query/`) | `lib/query/__tests__/` |
| Qualquer mudança | `npm run precheck:fast` no mínimo; `npm run precheck` antes de merge |

## Qualidade Mínima

- Lint com zero warnings (`eslint --max-warnings 0`).
- TypeScript strict sem erros (`tsc --noEmit`).
- Novas features de UI relevantes devem considerar verificação de acessibilidade com `vitest-axe`.

## Related Resources

- [Development Workflow](./development-workflow.md)
- [Security](./security.md)
