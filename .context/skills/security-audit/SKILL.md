---
type: skill
name: Security Audit
description: Review code and infrastructure for security weaknesses. Use when Reviewing code for security vulnerabilities, Assessing authentication/authorization, or Checking for OWASP top 10 issues
skillSlug: security-audit
phases: [R, V]
generated: 2026-06-12
status: filled
scaffoldVersion: "2.0.0"
---
## Workflow

1. Mapear o escopo da auditoria contra as superfícies críticas do NossoCRM:
   - `lib/ai/tools.ts` / `lib/ai/crmAgent.ts` — tools de IA
   - `app/api/public/` / `lib/public-api/` — API pública
   - `app/api/mcp` / `lib/mcp/` — servidor MCP
   - Rotas de webhook em `app/api/`
   - `lib/supabase/staticAdminClient.ts` — usos do service-role
   - `proxy.ts` / `lib/supabase/middleware.ts` — autenticação de páginas
   - `app/install` / `app/api/setup-instance` — installer
2. Para cada query nova/alterada: verificar filtro `organization_id` (Grep por `.from(` nos arquivos tocados).
3. Para cada migração: verificar política RLS na tabela.
4. Verificar validação Zod de inputs externos e ausência de segredos hardcoded/logados.
5. Rodar suites de segurança:
   `npx vitest test/aiToolsRbac.test.ts test/tools.multiTenant.test.ts test/tools.salesTeamMatrix.test.ts test/supabaseMiddleware.test.ts`
6. Reportar achados com severidade, localização e correção.

## Examples

**Achado típico:**
```markdown
### [ALTA] Tool de IA sem isolamento de tenant
- Arquivo: lib/ai/tools.ts:230 (searchDeals)
- Problema: query `.from('deals')` sem `.eq('organization_id', ...)`
- Impacto: usuário pode ler deals de outras organizações via chat
- Correção: adicionar filtro e caso em test/tools.multiTenant.test.ts
```

## Quality Bar

- Zero falsos achados: confirmar exploitabilidade lendo o fluxo completo.
- Toda correção sugerida vem com teste que previne regressão.
- Service-role: cada uso justificado, server-side e com filtro manual de organização.

## Resource Strategy

- Apenas SKILL.md; tabela de superfícies espelhada em `.context/docs/security.md`.
