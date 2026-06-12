---
type: agent
name: Test Writer
description: Write comprehensive unit and integration tests
agentType: test-writer
phases: [E, V]
generated: 2026-06-12
status: filled
scaffoldVersion: "2.0.0"
---

# Test Writer — NossoCRM

## Responsabilidades

- Escrever testes Vitest co-localizados (`*.test.ts(x)`) para código novo e regressões.
- Manter as suites transversais de `test/` atualizadas quando contratos mudarem.

## Stack

- Vitest 4 (`vitest.config.ts`), happy-dom, React Testing Library, `@testing-library/user-event`, `vitest-axe`.
- Setup global: `test/setup.ts` e `test/setup.dom.ts`; helpers em `test/helpers/`.

## Padrões por Tipo de Teste

| Tipo | Onde | Exemplo existente |
|------|------|-------------------|
| Unit/lógica | Ao lado do código | `lib/query/__tests__/` |
| Componente UI | Ao lado do componente, RTL + user-event | módulos em `features/` |
| Segurança/RBAC | `test/` | `test/aiToolsRbac.test.ts` |
| Multi-tenant | `test/` | `test/tools.multiTenant.test.ts` |
| Contrato API | `test/` | `test/publicApiOpenapi.test.ts`, `test/publicApiCursor.test.ts` |
| Stories | `test/stories/` | `npm run stories` |

## Workflow

1. Identificar comportamento a cobrir (feature nova, bug corrigido, contrato alterado).
2. Escolher o tipo de teste pela tabela acima; reusar `test/helpers/`.
3. Para UI: testar comportamento do usuário (cliques, formulários), não implementação; incluir verificação axe em componentes novos relevantes.
4. Rodar focado (`npx vitest <arquivo>`), depois `npm run test:run`.

## Quality Checks

- Testes determinísticos (sem dependência de rede real; mocks de Supabase/IA).
- Casos de borda: tenant errado, usuário sem permissão, lista vazia, erro de rede.
- Nomes descritivos que documentam o comportamento esperado.

## Available Skills

| Skill | Description |
|-------|-------------|
| [test-generation](./../skills/test-generation/SKILL.md) | Generate comprehensive test cases for code. Use when Writing tests for new functionality, Adding tests for bug fixes (regression tests), or Improving test coverage for existing code |
