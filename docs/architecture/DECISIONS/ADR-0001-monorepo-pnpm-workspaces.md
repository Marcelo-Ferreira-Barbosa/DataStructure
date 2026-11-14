# ADR-0001 — Monorepo com pnpm Workspaces e quatro unidades

- **Status:** Proposta (pnpm Workspaces: ✅ confirmado na stack; a divisão em unidades é 💡)
- **Data:** 13/11/2026
- **Requisitos relacionados:** RNF-020, RNF-021, RNF-023, RNF-024, RNF-031

## Contexto

O projeto tem três áreas (Front-end, Back-end, Engine) e precisa compartilhar tipos e regras entre elas. A Engine deve ser independente de React e Express (✅). O autor é um estudante e o projeto evolui progressivamente, então a estrutura deve ser simples de entender e de operar. A stack confirmada inclui pnpm Workspaces.

## Decisão

Um único repositório com **quatro unidades de código** mais testes E2E:

- `apps/web` — Front-end.
- `apps/api` — Back-end.
- `packages/engine` — Engine (zero dependências, ver ADR-0002).
- `packages/contracts` — contratos de fronteira com Zod (ver ADR-0007).
- `e2e` — testes Playwright, sem importar código do projeto (introduzido depois).

Direção de dependências: `engine` ← `contracts` ← (`web`, `api`); `web` também depende de `engine`; `api` depende de `engine` apenas se o ADR-0006 opcional for aprovado. **Nenhum** pacote depende de `web` ou `api`.

Os limites são impostos por mecanismos automáticos (modo estrito do pnpm, `tsconfig` restritivo na Engine, regras de lint e teste de arquitetura na CI), conforme a seção 6.4 de `ARCHITECTURE.md`.

**Consumo dos pacotes (❓ Q38):** recomenda-se uma prova de conceito no setup comparando (A) pacotes consumidos pelo código-fonte TypeScript, com `tsx` em desenvolvimento e `tsup` para empacotar a API; e (B) `tsc -b` com referências de projeto e `dist`. A preferência inicial é (A), pela ausência de *builds* intermediários.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| **Dois repositórios** (front e back) | Duplicaria tipos e a Engine; dificulta mudanças atômicas e a CI |
| **Um pacote só, sem *workspaces*** | A isolação da Engine viraria convenção, não verificação mecânica |
| **Mais pacotes** (ex.: `ui`, `config`, `content`, `errors`) | Excesso de engenharia para um estudante (risco R-04); só se justifica quando houver reuso real |
| **Turborepo / Nx** | Orquestração e cache não compensam com 4–5 pacotes; reavaliar se a CI superar 10 min |
| **Engine como pacote publicado externamente** | Sem necessidade; aumenta o custo de manutenção |

## Justificativa

A necessidade de compartilhar a Engine e os contratos entre dois aplicativos é a razão clássica para um monorepo. Quatro unidades é o mínimo que separa as responsabilidades pedidas (três áreas) e acrescenta somente o que o compartilhamento de tipos exige. O modo estrito do pnpm transforma "a Engine não depende de nada" de promessa em fato verificável.

## Consequências

**Positivas**
- Mudanças atômicas atravessando Engine, contratos, Web e API em um único *commit*.
- A isolação da Engine é verificável por ferramenta.
- Uma única CI e um único conjunto de scripts.

**Negativas / custos**
- Configuração inicial de TypeScript e *workspaces* tem curva de aprendizado (risco R-06).
- Ferramentas adicionais conforme a opção de consumo escolhida (`tsx`, `tsup`).

**Mitigação:** PoC no setup, decisão registrada e documentação no README. Se o monorepo causar atrito desproporcional, a Engine e os contratos continuam sendo pacotes independentes, o que mantém a opção de reorganizar sem reescrever código.

## Pontos em aberto
- ❓ Q38 — forma de consumo dos pacotes.
