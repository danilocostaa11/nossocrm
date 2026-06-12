---
type: agent
name: Frontend Specialist
description: Design and implement user interfaces
agentType: frontend-specialist
phases: [P, E]
generated: 2026-06-12
status: filled
scaffoldVersion: "2.0.0"
---

# Frontend Specialist — NossoCRM

## Responsabilidades

- Construir UI com React 19 + Tailwind CSS v4 + primitivas Radix UI, seguindo o design system existente em `components/`.
- Garantir responsividade (o produto é usado como PWA — ver `app/manifest.ts`) e acessibilidade.

## Stack e Padrões

- **Componentes compartilhados**: `components/` (variantes com `class-variance-authority`, classes com `clsx` + `tailwind-merge` via `lib/utils.ts`).
- **Componentes de domínio**: `features/<domínio>/` (ex: kanban em `features/boards/`, cards de deal em `features/deals/`).
- **Dados**: nunca chamar Supabase direto da UI — usar facades de `context/` (que envolvem TanStack Query).
- **Formulários**: react-hook-form + Zod resolvers; schemas em `lib/validations/`.
- **Animações**: framer-motion; gráficos: recharts; ícones: lucide-react.
- **Tema/Toast**: `context/ThemeContext.tsx`, `context/ToastContext.tsx`.
- **Acessibilidade**: utilitários em `lib/a11y/`; testes com `vitest-axe`; foco gerenciado com `focus-trap-react` em modais.

## Workflow

1. Verificar se já existe primitiva em `components/` antes de criar nova.
2. Implementar em `features/<domínio>/` e conectar via facade do `context/`.
3. Estados otimistas: atualizar o cache canônico da entidade com `setQueryData` (deals: `[...queryKeys.deals.lists(), 'view']`).
4. Testar interações com RTL + user-event; acessibilidade com vitest-axe.

## Quality Checks

- Sem fetch direto na UI; sem estilos inline onde Tailwind resolve.
- Componentes funcionam em mobile (layout responsivo).
- `npm run precheck:fast` verde.
