---
type: skill
name: Documentation
description: Generate and update technical documentation. Use when Documenting new features or APIs, Updating docs for code changes, or Creating README or getting started guides
skillSlug: documentation
phases: [P, C]
generated: 2026-06-12
status: filled
scaffoldVersion: "2.0.0"
---
## Workflow

1. Identificar o público e o destino correto:
   - Usuário final → `README.md` (português, tom acessível, sem jargão)
   - Integrador externo → `docs/public-api.md`, `docs/webhooks.md`, `docs/mcp.md`
   - Desenvolvedor/agente → `.context/docs/` e `AGENTS.md`
2. Verificar o código real antes de escrever (rotas em `app/api/`, tools em `lib/ai/tools.ts`, schemas em `lib/validations/`).
3. Usar caminhos de arquivo concretos, exemplos executáveis e tabelas para referência.
4. Atualizar docs no MESMO PR da mudança de código.
5. Se o contrato da API pública mudou, conferir alinhamento com `test/publicApiOpenapi.test.ts`.

## Examples

**Padrão do README (usuário final):** seções com emoji, passos numerados, diagramas mermaid para fluxos (ver fluxo Fork → Vercel → `/install` no `README.md`).

**Padrão de doc técnica:**
```markdown
| Endpoint | Método | Auth | Descrição |
|----------|--------|------|-----------|
| `/api/public/contacts` | GET | API key | Lista contatos com paginação por cursor |
```

## Quality Bar

- Nenhum link ou caminho de arquivo quebrado.
- Exemplos refletem a API/código atual (chaves de cache, endpoints, payloads).
- Material de usuário final em português correto e acessível.

## Resource Strategy

- Apenas SKILL.md; templates implícitos nos docs existentes em `docs/` e `.context/docs/`.
