# DataStructure Studio

Plataforma interativa para aprender estruturas de dados e algoritmos com visualização passo a passo.
Documentação em [`docs/`](docs/); estrutura do repositório em
[`docs/architecture/PROJECT_STRUCTURE.md`](docs/architecture/PROJECT_STRUCTURE.md).

## Requisitos
- Node.js >= 22.12 (ver `.nvmrc`)
- pnpm 12 (`corepack enable` ou `npm i -g pnpm@12.18.0`)

## Começando
```bash
pnpm install
cp .env.example .env
pnpm dev          # API em :3000 e Web em :5173
```

## Scripts (raiz)
| Comando | O que faz |
|---|---|
| `pnpm dev` | Sobe API e Web em modo de desenvolvimento |
| `pnpm dev:web` / `pnpm dev:api` | Sobe só um dos dois |
| `pnpm typecheck` | Verifica tipos em todos os pacotes |
| `pnpm test` | Roda os testes (Vitest) em todos os pacotes |
| `pnpm build` | Build de produção do Web |
| `pnpm check` | typecheck + test + build |
