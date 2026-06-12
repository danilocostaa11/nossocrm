---
type: skill
name: Test Generation
description: Generate comprehensive test cases for code. Use when Writing tests for new functionality, Adding tests for bug fixes (regression tests), or Improving test coverage for existing code
skillSlug: test-generation
phases: [E, V]
generated: 2026-06-12
status: filled
scaffoldVersion: "2.0.0"
---
## Workflow

1. Identificar o tipo de teste e o local correto:
   - Lógica/unit → `*.test.ts` ao lado do código (ex: `lib/query/__tests__/`)
   - Componente UI → `*.test.tsx` ao lado, com RTL + `@testing-library/user-event`
   - Segurança/RBAC/multi-tenant → `test/` (seguir `test/aiToolsRbac.test.ts`, `test/tools.multiTenant.test.ts`)
   - Contrato de API → `test/` (seguir `test/publicApiOpenapi.test.ts`)
2. Reusar infraestrutura: `test/setup.ts`, `test/setup.dom.ts`, helpers de `test/helpers/`.
3. Mockar dependências externas (Supabase, provedores de IA) — testes nunca dependem de rede real.
4. Cobrir casos de borda obrigatórios do domínio: tenant errado, usuário sem permissão, lista vazia, erro de rede/Supabase.
5. Para UI: testar comportamento do usuário, não implementação; adicionar verificação `vitest-axe` em componentes novos relevantes.
6. Rodar: `npx vitest <arquivo>` durante o desenvolvimento, `npm run test:run` ao final.

## Examples

**Teste de componente (padrão do repo):**
```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

it('abre o formulário de novo deal ao clicar no botão', async () => {
  const user = userEvent.setup();
  render(<PipelineHeader />, { wrapper: TestProviders });
  await user.click(screen.getByRole('button', { name: /novo deal/i }));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
});
```

**Caso multi-tenant (obrigatório para tools de IA):**
```ts
it('não retorna deals de outra organização', async () => {
  const result = await searchDealsTool.execute(
    { query: 'Acme' },
    { organizationId: ORG_A }
  );
  expect(result.every((d) => d.organization_id === ORG_A)).toBe(true);
});
```

## Quality Bar

- Testes determinísticos e independentes de ordem.
- Nomes descrevem o comportamento esperado em linguagem clara.
- Bug fix sem teste de regressão é entrega incompleta.

## Resource Strategy

- Apenas SKILL.md; helpers compartilhados já existem em `test/helpers/`.
