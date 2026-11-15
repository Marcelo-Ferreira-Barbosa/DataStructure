# DataStructure Studio

Plataforma interativa para aprender estruturas de dados e algoritmos com visualização passo a passo.
Documentação em [`docs/`](docs/); estrutura do repositório em
[`docs/architecture/PROJECT_STRUCTURE.md`](docs/architecture/PROJECT_STRUCTURE.md).

## Requisitos

- Node.js >= 22.22.2 (ver `.nvmrc`)
- pnpm 12 (`corepack enable` ou `npm i -g pnpm@12.18.0`)

## Começando

```bash
pnpm install
cp .env.example .env
pnpm dev          # API em :3000 e Web em :5173
```

## Scripts (raiz)

| Comando                             | O que faz                                                                |
| ----------------------------------- | ------------------------------------------------------------------------ |
| `pnpm dev`                          | Sobe API e Web em modo de desenvolvimento                                |
| `pnpm dev:web` / `pnpm dev:api`     | Sobe só um dos dois                                                      |
| `pnpm format` / `pnpm format:check` | Formata com o Prettier / só verifica                                     |
| `pnpm lint` / `pnpm lint:fix`       | Análise estática com o ESLint (inclui regras de fronteira entre pacotes) |
| `pnpm typecheck`                    | Verifica tipos (TypeScript strict) em todos os pacotes                   |
| `pnpm test`                         | Roda os testes (Vitest) em todos os pacotes                              |
| `pnpm test:coverage`                | Testes da Engine com piso de cobertura de 90%                            |
| `pnpm build`                        | Build de produção do Web                                                 |
| `pnpm check`                        | Tudo o que a CI roda, na mesma ordem                                     |
