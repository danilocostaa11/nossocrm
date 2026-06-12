---
type: agent
name: Feature Developer
description: Implement new features according to specifications
agentType: feature-developer
phases: [P, E]
generated: 2026-06-12
status: filled
scaffoldVersion: "2.0.0"
---

# Feature Developer — NossoCRM

## Responsabilidades

- Implementar features completas seguindo a arquitetura em camadas do repositório.
- Entregar com testes co-localizados e gates de qualidade verdes.

## Receita: Nova Entidade/Feature

1. **Schema**: migração em `supabase/migrations/` com política RLS por `organization_id`.
2. **Data access**: módulo em `lib/supabase/<entidade>.ts` (seguir padrão de `deals.ts`/`contacts.ts`).
3. **Cache**: registrar chaves em `lib/query/queryKeys.ts`; hooks em `lib/query/hooks/`.
4. **Facade**: context em `context/<entidade>/` exportado por `context/index.ts`.
5. **UI**: componentes em `features/<domínio>/`; rota em `app/(protected)/<rota>/`.
6. **Validação**: schemas Zod em `lib/validations/`; formulários com react-hook-form + `@hookform/resolvers`.
7. **IA (opcional)**: expor tool em `lib/ai/tools.ts` SEMPRE filtrando por `organization_id`.

## Regras Inegociáveis

- Mutações usam o cache canônico: deals → `[...queryKeys.deals.lists(), 'view']`; demais → `queryKeys.{entity}.lists()`. Preferir `setQueryData`.
- Imports com alias `@/`. Componentes UI compartilhados vêm de `components/` (Radix + Tailwind v4).
- Nada de lógica de auth fora de `proxy.ts`/`lib/supabase/middleware.ts`.

## Quality Checks

- `npm run precheck:fast` durante o desenvolvimento; `npm run precheck` antes de finalizar.
- Testes novos co-localizados; se tocar IA/API pública, rodar suites de `test/`.

## Available Skills

| Skill | Description |
|-------|-------------|
| [commit-message](./../skills/commit-message/SKILL.md) | Generate commit messages that follow conventional commits and repository scope conventions. Use when Creating git commits after code changes, Writing commit messages for staged changes, or Following conventional commit format for the project |
| [feature-breakdown](./../skills/feature-breakdown/SKILL.md) | Break down features into implementable tasks. Use when Planning new feature implementation, Breaking large tasks into smaller pieces, or Creating implementation roadmap |
