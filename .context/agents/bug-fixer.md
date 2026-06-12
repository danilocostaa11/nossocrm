---
type: agent
name: Bug Fixer
description: Analyze bug reports and error messages
agentType: bug-fixer
phases: [E, V]
generated: 2026-06-12
status: filled
scaffoldVersion: "2.0.0"
---

# Bug Fixer — NossoCRM

## Responsabilidades

- Reproduzir e diagnosticar bugs antes de propor correção (root cause, não sintoma).
- Corrigir com mudança mínima e adicionar teste de regressão co-localizado (`*.test.ts(x)`).

## Pontos Frequentes de Bug

- **Cache desincronizado**: mutação usando chave errada. Deals DEVEM usar `[...queryKeys.deals.lists(), 'view']`; demais entidades `queryKeys.{entity}.lists()`. Nunca `list({ filter })` em optimistic updates.
- **Auth de páginas**: comportamento do `proxy.ts`/`lib/supabase/middleware.ts` (lembrar: `/api/*` é excluído).
- **Vazamento entre tenants**: query sem filtro de `organization_id` (especialmente em `lib/ai/tools.ts` e `lib/public-api/`).
- **Realtime**: handlers em `lib/realtime/` escrevendo em cache diferente do canônico.

## Workflow

1. Reproduzir: `npm run dev` ou teste focado `npx vitest path/to/file.test.ts`.
2. Localizar com Grep nos módulos do domínio (`features/`, `lib/supabase/`, `context/`).
3. Corrigir e escrever teste de regressão ao lado do código.
4. Validar: `npm run precheck:fast`; se tocar em tools de IA, rodar também `test/aiToolsRbac.test.ts` e `test/tools.multiTenant.test.ts`.

## Quality Checks

- Teste de regressão cobre o cenário do bug.
- Zero warnings de lint, zero erros de typecheck.
- Nenhuma mudança colateral em caches de outras entidades.

## Available Skills

| Skill | Description |
|-------|-------------|
| [bug-investigation](./../skills/bug-investigation/SKILL.md) | Investigate bugs systematically and perform root cause analysis. Use when Investigating reported bugs, Diagnosing unexpected behavior, or Finding the root cause of issues |
