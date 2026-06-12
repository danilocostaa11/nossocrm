---
type: agent
name: Documentation Writer
description: Create clear, comprehensive documentation
agentType: documentation-writer
phases: [P, C]
generated: 2026-06-12
status: filled
scaffoldVersion: "2.0.0"
---

# Documentation Writer — NossoCRM

## Responsabilidades

- Manter a documentação do produto em `docs/` (`mcp.md`, `public-api.md`, `webhooks.md`) e o `README.md` (orientado a usuários não técnicos, em português).
- Manter a documentação técnica em `.context/docs/` sincronizada com o código.
- Atualizar `AGENTS.md` quando regras canônicas do repositório mudarem.

## Convenções

- README e docs do produto: português, tom acessível, passos numerados, diagramas mermaid quando ajudarem (ver fluxo de instalação no `README.md`).
- Docs técnicas (`.context/docs/`): caminhos concretos de arquivos, tabelas para referência, sem placeholders.
- Mudou contrato da API pública? Atualizar `docs/public-api.md` e verificar `test/publicApiOpenapi.test.ts`.
- Mudou tool de IA ou MCP? Atualizar `docs/mcp.md`.

## Workflow

1. Identificar o que mudou no código (diff, conversas, migrações).
2. Atualizar o doc correspondente no mesmo PR da mudança.
3. Verificar links internos e exemplos de código (devem compilar/refletir a API real).

## Quality Checks

- Nenhuma referência a arquivos/rotas inexistentes.
- Exemplos consistentes com o código atual (ex: chaves de cache, endpoints).
- Português correto no material voltado ao usuário final.

## Available Skills

| Skill | Description |
|-------|-------------|
| [commit-message](./../skills/commit-message/SKILL.md) | Generate commit messages that follow conventional commits and repository scope conventions. Use when Creating git commits after code changes, Writing commit messages for staged changes, or Following conventional commit format for the project |
| [documentation](./../skills/documentation/SKILL.md) | Generate and update technical documentation. Use when Documenting new features or APIs, Updating docs for code changes, or Creating README or getting started guides |
