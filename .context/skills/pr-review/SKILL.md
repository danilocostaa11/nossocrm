---
type: skill
name: Pr Review
description: Review pull requests against team standards and best practices. Use when Reviewing a pull request before merge, Providing feedback on proposed changes, or Validating PR meets project standards
skillSlug: pr-review
phases: [R, V]
generated: 2026-06-12
status: filled
scaffoldVersion: "2.0.0"
---
## Workflow

1. Contexto: ler descrição do PR e `git diff main...HEAD` completo (todos os commits, não só o último).
2. Escopo: o PR faz UMA coisa? Mistura de feature + refactor não relacionado deve ser apontada.
3. Aplicar o checklist do repo (mesmo da skill [code-review](../code-review/SKILL.md)):
   - Cache canônico por entidade (deals: `[...queryKeys.deals.lists(), 'view']`)
   - `organization_id` em toda query nova; RLS em migrações
   - Auth via `proxy.ts`; `staticAdminClient` só server-side
   - Imports `@/`, módulos por domínio, Zod para inputs externos
4. Verificar gates: `npm run precheck` (lint zero warnings + typecheck + testes + build).
5. Se tocou contratos externos: `docs/public-api.md`/`docs/webhooks.md`/`docs/mcp.md` atualizados? Testes de contrato (`test/publicApiOpenapi.test.ts`) passam?
6. Veredito estruturado: Aprovado / Aprovado com ressalvas / Mudanças necessárias, com itens acionáveis.

## Examples

**Estrutura de feedback:**
```markdown
## Veredito: Mudanças necessárias

### Bloqueadores
- `features/deals/DealCard.tsx:42` — mutação usa `queryKeys.deals.list({ boardId })`;
  deve usar `[...queryKeys.deals.lists(), 'view']` (regra de cache do AGENTS.md)

### Sugestões
- Extrair schema Zod inline para `lib/validations/`

### Pontos positivos
- Teste multi-tenant incluído para a nova tool
```

## Quality Bar

- Todo bloqueador cita arquivo/linha e a regra violada.
- Review cobre testes e docs, não só código.
- Tom objetivo e acionável.

## Resource Strategy

- Apenas SKILL.md; reusa o checklist da skill code-review.
