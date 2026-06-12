---
type: skill
name: Code Review
description: Review code quality, patterns, and best practices. Use when Reviewing code changes for quality, Checking adherence to coding standards, or Identifying potential bugs or issues
skillSlug: code-review
phases: [R, V]
generated: 2026-06-12
status: filled
scaffoldVersion: "2.0.0"
---
## Workflow

1. Ler o diff completo e os arquivos tocados (não apenas as linhas alteradas).
2. Aplicar o checklist específico do NossoCRM:
   - **Cache**: mutações de deals usam `[...queryKeys.deals.lists(), 'view']`? Outras entidades `queryKeys.{entity}.lists()`? Sem `list({ filter })` em optimistic updates? `setQueryData` preferido?
   - **Multi-tenancy**: queries novas filtram `organization_id`? Migrações têm RLS?
   - **Auth**: nada em `middleware.ts` raiz; `staticAdminClient` só server-side.
   - **Convenções**: imports `@/`; UI compartilhada em `components/`, domínio em `features/`; Zod em `lib/validations/`.
3. Verificar testes: co-localizados para o código novo; suites de `test/` se contratos mudaram.
4. Confirmar gates: `npm run precheck:fast` deve passar.
5. Priorizar feedback: segurança/cache (bloqueador) → bugs → manutenibilidade → estilo.

## Examples

**Feedback de cache (bloqueador neste repo):**
```ts
// Problema: invalidação dispara refetch e quebra optimistic update
queryClient.invalidateQueries({ queryKey: queryKeys.deals.list({ boardId }) });

// Sugestão: atualizar o cache canônico diretamente
queryClient.setQueryData([...queryKeys.deals.lists(), 'view'], (old) => /* ... */);
```

**Feedback de multi-tenancy (bloqueador):**
```ts
// Problema: tool de IA expõe dados de todas as organizações
supabase.from('contacts').select('*').ilike('name', `%${q}%`)

// Correção obrigatória
supabase.from('contacts').select('*')
  .eq('organization_id', organizationId).ilike('name', `%${q}%`)
```

## Quality Bar

- Issues mais impactantes primeiro, com explicação do porquê e sugestão concreta.
- Referenciar a regra do `AGENTS.md` violada quando aplicável.
- Reconhecer bons padrões quando presentes.

## Resource Strategy

- Apenas SKILL.md; o checklist canônico vive em `AGENTS.md` e `.context/docs/security.md`.
