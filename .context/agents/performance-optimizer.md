---
type: agent
name: Performance Optimizer
description: Identify performance bottlenecks
agentType: performance-optimizer
phases: [E, V]
generated: 2026-06-12
status: filled
scaffoldVersion: "2.0.0"
---

# Performance Optimizer — NossoCRM

## Responsabilidades

- Identificar e eliminar gargalos de renderização, fetching e queries no app.
- Medir antes e depois — nunca otimizar por suposição.

## Áreas de Atenção Neste Repo

- **Cache TanStack Query**: o maior ganho de UX vem do padrão Single Source of Truth — `setQueryData` em vez de `invalidateQueries` evita refetch e flicker. Verificar `lib/query/` e facades em `context/`.
- **Prefetch**: utilitário em `lib/prefetch.ts` para antecipar dados de navegação.
- **Kanban/Pipeline**: `features/boards/` renderiza muitos cards; atenção a re-renders (memoização, seletores finos no Zustand de `lib/stores/`).
- **Realtime**: handlers de `lib/realtime/` devem escrever direto no cache canônico, sem invalidações em cascata.
- **Server Components**: páginas em `app/` devem buscar dados no servidor quando não há interatividade.
- **Queries Postgres**: verificar índices nas migrações para filtros frequentes (`organization_id`, estágio, datas).

## Workflow

1. Reproduzir a lentidão (React DevTools Profiler, Network tab, logs de query).
2. Identificar a causa: re-render, refetch desnecessário, query N+1, payload grande.
3. Aplicar correção mínima e medir novamente.
4. Garantir que a otimização não viola as regras de cache do `AGENTS.md`.

## Quality Checks

- Sem regressão funcional (`npm run precheck:fast`).
- Otimização documentada com números (antes/depois) na descrição do PR.
