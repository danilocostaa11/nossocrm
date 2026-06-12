---
type: doc
name: tooling
description: Build tools, linters, configs, and developer tooling
category: tooling
generated: 2026-06-12
status: filled
scaffoldVersion: "2.0.0"
---

# Tooling

## Build e Runtime

- **Next.js 16** — `next.config.ts`; App Router; `npm run dev` / `npm run build` / `npm start`.
- **TypeScript 5 strict** — `tsconfig.json` com alias `@/*` apontando para a raiz.
- **Node/npm** — `package.json` com `"type": "module"`; lockfile npm (`package-lock.json`).

## Qualidade

- **ESLint 9** — `eslint.config.mjs` (flat config) com `eslint-config-next`; rodado com `--max-warnings 0`.
- **TypeScript** — `npm run typecheck` (`tsc --noEmit`).
- **Vitest 4** — `vitest.config.ts`; ambiente happy-dom; setup em `test/setup.ts` e `test/setup.dom.ts`.
- **Gates**: `npm run precheck` (lint + typecheck + test + build) e `npm run precheck:fast` (sem build).

## Estilo e UI

- **Tailwind CSS v4** — `tailwind.config.js` + `postcss.config.mjs` (`@tailwindcss/postcss`); estilos globais em `app/globals.css`.
- **Radix UI** — primitivas (dialog, dropdown, select, tabs, tooltip, etc.).
- **Utilitários**: `clsx`, `tailwind-merge`, `class-variance-authority` (em `lib/utils.ts`).

## Banco de Dados

- **Supabase CLI** — `supabase/config.toml`; migrações em `supabase/migrations/`; reset com `supabase/reset.sql`; Edge Functions em `supabase/functions/`.

## IA

- **AI SDK v6** (`ai` 6.x) com provedores `@ai-sdk/anthropic`, `@ai-sdk/openai`, `@ai-sdk/google` — configuração em `lib/ai/config.ts` e `lib/ai/provider.ts`.

## Scripts Auxiliares

- `scripts/smoke-integrations.mjs` — smoke test de integrações (`npm run smoke:integrations`).

## Variáveis de Ambiente

Configuradas via wizard `/install` ou manualmente na Vercel: credenciais Supabase (URL, anon key, service-role key) e chaves dos provedores de IA. Nunca commitar valores em código.

## Related Resources

- [Development Workflow](./development-workflow.md)
- [Testing Strategy](./testing-strategy.md)
