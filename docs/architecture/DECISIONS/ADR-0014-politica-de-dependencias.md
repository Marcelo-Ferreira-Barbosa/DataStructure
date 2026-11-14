# ADR-0014 — Política de dependências e avaliação da stack

- **Status:** Proposta (❓ Q41, Q43)
- **Data:** 13/11/2026
- **Requisitos relacionados:** RNF-005, RNF-011, RNF-020, RNF-021, RNF-022, RNF-024
- **Origem:** pedido explícito do autor — "avalie se todas as tecnologias sugeridas são realmente necessárias; não adicione dependências sem justificativa".

## Contexto

A stack inicial tem 17 itens (React, TypeScript, JavaScript, Node.js, Express, PostgreSQL, Prisma, HTML5/CSS3, Vite, Tailwind CSS, Zustand, Zod, Vitest, Playwright, Docker, GitHub Actions, pnpm Workspaces). Cada dependência adicional custa: tempo de aprendizado, superfície de segurança, atualização, peso no *bundle* e risco de abandono. O projeto é feito por um estudante, de forma progressiva, e tem a Engine com **zero dependências** (ADR-0002).

## Decisão

### 1. Regra geral
**Uma dependência só entra se houver justificativa registrada** com: (a) requisito ou problema que resolve, (b) por que a alternativa sem dependência não basta, (c) custo (peso, manutenção, segurança), (d) onde pode ser usada (a **Engine nunca**). Dependências de desenvolvimento seguem a mesma regra, com critério um pouco mais brando.

### 2. Veredito sobre a stack inicial

| Tecnologia | Veredito | Resumo da justificativa |
|---|---|---|
| React, TypeScript, Vite, Node.js, Express, PostgreSQL, Prisma, Vitest, GitHub Actions, pnpm Workspaces | **Mantidas** | Cada uma cumpre um papel que as alternativas sem ela não cumpririam melhor neste projeto |
| **JavaScript** | **Absorvida** pelo TypeScript | Não é tecnologia separada. `.js` só quando uma ferramenta exigir (configurações). Todo código de aplicação é TypeScript |
| HTML5 / CSS3 | Mantidas (base) | `<dialog>` nativo para diálogos; CSS puro só em casos pontuais |
| **Tailwind CSS** | Mantida **por conveniência** | Não é indispensável; entrega consistência de *design tokens*, responsividade e modo escuro com pouco CSS. Alternativa viável: CSS Modules |
| **Zustand** | Mantida **com escopo restrito** | Sessão de laboratório e preferências (ADR-0010). Não vira estado global |
| **Zod** | Mantida **somente em `contracts`** | Validação de fronteiras; fora da Engine |
| **Playwright** | Mantida, **introdução adiada** | Só após o primeiro fluxo vertical |
| **Docker** | Mantida **em duas etapas** | 1º PostgreSQL; depois a imagem do app (ADR-0012) |

### 3. Adições propostas (aguardam aprovação — Q43)

| Adição | Justificativa | Alternativa sem dependência | Onde |
|---|---|---|---|
| **React Router** | RF-003: URLs próprias, voltar/recarregar, rotas protegidas | Roteador próprio (não compensa) | Web |
| **TanStack Query** *(opcional, Q36)* | Carregando/vazio/erro, nova tentativa e invalidação de cache em ~8 chamadas | Hooks próprios com `fetch` | Web |
| **Testing Library + jsdom** | Testar que o DOM reflete o estado em cada passo (RF-016) | Nenhuma razoável | Web (dev) |
| **ESLint + typescript-eslint + Prettier** | Padrão de código e **regras de limite entre pacotes** (RNF-021, ADR-0001) | **Biome** (uma ferramenta só; menos regras de limite) — Q41 | Raiz (dev) |
| **express-rate-limit** | Limitar tentativas por IP (RNF-005) | Contador próprio (já necessário por conta, no banco) | API |
| **helmet** | Cabeçalhos de segurança | Configurar à mão (propenso a erro) | API |
| **@vitest/coverage-v8** | Cobertura do núcleo (RNF-028) | Nenhuma | Dev |
| **tsx** e **tsup** *(dependem de Q38)* | Rodar e empacotar a API consumindo pacotes do workspace | `tsc -b` com referências de projeto | API (dev/build) |

### 4. Considerados e **rejeitados**

Redux/MobX, Axios, Next.js/SSR, GraphQL, tRPC, D3, Framer Motion, kits de UI (Material, Chakra etc.), Passport e bibliotecas JWT, Redis, Turborepo/Nx, `fast-check`, `supertest`, *Web Worker*. Motivos na seção 4.3 de `ARCHITECTURE.md`.

### 5. Adiadas (sem decisão agora)

Biblioteca de *logging* (usar registro estruturado simples até haver necessidade), monitoramento/métricas, biblioteca de internacionalização (Q3), `argon2` (Q39), biblioteca de componentes acessíveis (só se `<dialog>` não bastar).

### 6. Governança
- Cada adição relevante gera uma **nota curta** (no ADR, ou em um ADR novo se for estrutural).
- **Auditoria de dependências** e **varredura de segredos** rodam na CI.
- Versões **fixadas** no setup; atualizações em *pull requests* dedicados.
- **A Engine tem `package.json` sem `dependencies`**, verificado por teste de arquitetura na CI.
- **Revisão periódica:** a cada marco do projeto, listar dependências e remover as que perderam utilidade.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| **Aceitar toda a stack inicial sem avaliação** | Mantém itens sem função (JavaScript como "tecnologia") e sem escopo definido (Zustand) |
| **Reduzir ao mínimo absoluto** (sem Tailwind, sem Zustand, sem Prisma) | Não responde melhor aos requisitos e afasta o projeto do que o autor quer demonstrar (stack confirmada) |
| **Adotar várias bibliotecas "para o futuro"** | Contraria o pedido explícito do autor |

## Justificativa

A política torna cada dependência uma **decisão consciente e rastreável**, protege a Engine, reduz superfície de segurança e peso do *bundle* (RNF-011) e mantém o projeto compreensível para quem o está construindo e para quem o avaliar como portfólio.

## Consequências

**Positivas**
- Conjunto pequeno e justificável; menos manutenção e menos riscos de segurança.
- Facilita explicar cada escolha em entrevistas.

**Negativas / custos**
- Escrever pequenos utilitários em vez de importá-los (PRNG, validação de entrada na Engine).
- Disciplina para registrar justificativas.

**Pontos em aberto**
- ❓ Q41 — ESLint + Prettier ou Biome.
- ❓ Q43 — aprovar o conjunto de adições da seção 3.
