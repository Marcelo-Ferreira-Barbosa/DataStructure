# DataStructure Studio — Estrutura do Monorepositório

> **Versão:** 0.1 (**proposta para aprovação**) · atualizada em 17/11/2026: árvore da Engine alinhada ao `ENGINE.md` (v0.2)
> **Data:** 14/11/2026
> **Base:** `ARCHITECTURE.md` (seção 6), ADR-0001, ADR-0002, ADR-0007, ADR-0013, ADR-0014 e `DATABASE.md`
> **Escopo:** define **onde cada coisa fica, como se chama e como se relaciona**. **Nada foi criado** no repositório: nenhuma pasta, arquivo de configuração ou dependência. A criação só ocorre **após a sua aprovação** (seção 13).

---

## 1. Como ler este documento

- ✅ **Confirmado:** vem do pedido, de requisito ou de ADR.
- 💡 **Proposta:** recomendação deste documento, aguardando aprovação.
- ❓ **Pendente:** decisão necessária antes do *scaffolding* (seção 16; numeração **Q65 a Q73**, continuando a dos documentos anteriores).
- **Legenda da árvore (seção 4):**
  - **●** criado no *scaffolding* inicial, quando você aprovar;
  - **○** criado **sob demanda**, quando a funcionalidade correspondente for implementada (não é criado agora);
  - **⊘** gerado por ferramentas e **não versionado**.
- Datas e versões de ferramentas citadas foram **consultadas no registro npm em 14/11/2026** (seção 15) e devem ser reconfirmadas no momento do setup.

---

## 2. Resumo executivo

1. **Sete áreas de topo, como pedido** (`apps/web`, `apps/api`, `packages/engine`, `packages/contracts`, `docs`, `infra`, `.github`) **mais uma pasta futura**, `e2e/`, herdada de ADR-0001 e criada **somente** quando os testes E2E entrarem (○).
2. **Estrutura mínima agora, crescimento por funcionalidade.** O *scaffolding* cria apenas o necessário para a CI ficar verde. Pastas de laboratórios, visualizadores, módulos da API e `e2e` nascem **junto com o código que as usa** (sem pastas vazias).
3. **`infra/` é plana** (`Dockerfile` e `compose.yaml`), sem subpasta `docker/`, até haver outra tecnologia de infraestrutura. Isso **substitui** a pasta `docker/` prevista em `ARCHITECTURE.md` §6.1.
4. **Configuração compartilhada fica na raiz** (TypeScript base, ESLint, Prettier, `.editorconfig`, `.gitignore`), **sem** um pacote `config` (ADR-0001 rejeitou pacotes extras).
5. **Versões compartilhadas por um catálogo do pnpm** (`catalog:`) em `pnpm-workspace.yaml`; pacotes internos por `workspace:*`; cada pacote **declara o que importa** (modo estrito do pnpm).
6. **Três camadas com regras de importação explícitas**: componentes (só apresentação), serviços (só comunicação) e regras de negócio (**só** na Engine e nos serviços da API). Imposto por regras de lint com recursos nativos do ESLint, **sem plugins** adicionais por ora.
7. **Nomenclatura:** código e commits em inglês; documentação e interface em português (❓ Q65). Arquivos `kebab-case`, componentes React `PascalCase`.
8. **Git:** desenvolvimento por ramos curtos a partir de `main`, **PRs com *squash merge*** e **Conventional Commits** validados na CI **sem** `husky`/`commitlint` (política de dependências, ADR-0014).
9. **Dois achados de versão exigem decisão no setup** (seção 15): o `typescript-eslint` ainda **não suporta o TypeScript 7**, e o `prisma` CLI tem como `latest` uma versão **candidata a lançamento** (RC) enquanto o cliente está na 7.x estável.

---

## 3. Mudanças em relação ao `ARCHITECTURE.md` §6.1

| Item | Antes | Agora | Motivo |
|---|---|---|---|
| Infraestrutura | `docker/` | **`infra/`** (plana) | Pedido atual; cobre Docker e futuras configurações de implantação |
| Automações | `.github/workflows/` | `.github/` com `workflows/`, modelo de PR e Dependabot | Detalhamento |
| E2E | `e2e/` na raiz | Mantida, **marcada ○ (sob demanda)** | Playwright entra após o primeiro fluxo vertical (ADR-0013) |
| Configuração compartilhada | `tsconfig.base.json` | Ampliada (seção 9) | Detalhamento |
| Pacotes | `engine`, `contracts` | Inalterados | — |

> Após a aprovação, `ARCHITECTURE.md` §6.1 será atualizada para **apontar para este documento**, evitando duas árvores divergentes.

---

## 4. Árvore completa de diretórios

> **Escopo da árvore:** é a estrutura **definitiva alvo**. Nem tudo é criado agora (ver legenda). Os nomes dentro de `src/` ilustram a organização; arquivos específicos de cada funcionalidade surgem quando ela é implementada.

```text
datastructure-studio/
├── .github/
│   ├── workflows/
│   │   └── ci.yml                         ●  Pipeline de CI (ADR-0013)
│   ├── dependabot.yml                     ●  Atualização de dependências
│   └── pull_request_template.md           ●  Checklist de PR
│
├── apps/
│   ├── api/                               # @dss/api — Express + Prisma
│   │   ├── prisma/
│   │   │   ├── schema.prisma              ●  Schema (DATABASE.md §8)
│   │   │   └── migrations/                ○  Geradas pelo Prisma
│   │   ├── src/
│   │   │   ├── main.ts                    ●  Ponto de entrada (liga o servidor)
│   │   │   ├── app.ts                     ●  Cria a aplicação Express (sem listen)
│   │   │   ├── config/                    ●  Leitura e validação de variáveis de ambiente
│   │   │   ├── db/                        ○  Instância do cliente Prisma
│   │   │   ├── http/                      ○  Transversais: erros, sessão, origem, taxa, request id
│   │   │   ├── lib/                       ○  Utilitários mínimos: relógio, erros de domínio
│   │   │   └── modules/                   ○  Um diretório por módulo
│   │   │       ├── auth/                  ○  routes, service, repository
│   │   │       ├── projects/              ○
│   │   │       ├── simulations/           ○
│   │   │       └── health/                ○
│   │   ├── test/                          ○  Apoio a testes de integração (banco, servidor)
│   │   ├── generated/                     ⊘  Cliente Prisma gerado (caminho final: Q60)
│   │   ├── package.json                   ●
│   │   ├── prisma.config.ts               ●  Se a versão do Prisma exigir (Q60)
│   │   ├── tsconfig.json                  ●
│   │   └── vitest.config.ts               ●
│   │
│   └── web/                               # @dss/web — React + Vite
│       ├── public/                        ○  Somente se houver ativos estáticos
│       ├── src/
│       │   ├── main.tsx                   ●  Ponto de entrada
│       │   ├── app/                       ●  Composição: providers, roteador, páginas
│       │   │   ├── pages/                 ○  Páginas T-01 a T-09
│       │   │   └── guards/                ○  Rotas protegidas
│       │   ├── features/                  ○  Funcionalidades (ver abaixo)
│       │   │   ├── lab/                   ○  Sessão de laboratório, reprodução, painéis
│       │   │   ├── visualizers/           ○  Um visualizador por tipo visual
│       │   │   ├── auth/                  ○  Cadastro, login, reautenticação
│       │   │   └── projects/              ○  Projetos e simulações salvas
│       │   ├── content/                   ○  Catálogo didático por idioma
│       │   │   └── pt-BR/                 ○  Mensagens, pseudocódigo, notas de complexidade
│       │   ├── shared/                    ○  Código reutilizável entre features
│       │   │   ├── api/                   ○  Cliente HTTP único
│       │   │   ├── ui/                    ○  Componentes de interface básicos
│       │   │   ├── hooks/                 ○  Hooks genéricos
│       │   │   └── lib/                   ○  Funções utilitárias puras
│       │   ├── styles/                    ●  Estilos globais (Tailwind)
│       │   └── test-setup.ts              ●  Configuração dos testes de componente
│       ├── index.html                     ●
│       ├── package.json                   ●
│       ├── tsconfig.json                  ●
│       └── vite.config.ts                 ●  Inclui a configuração do Vitest
│
├── packages/
│   ├── engine/                            # @dss/engine — TypeScript puro, ZERO dependências
│   │   ├── src/
│   │   │   ├── index.ts                   ●  API pública (única porta de entrada)
│   │   │   ├── core/                      ●  Contratos, defineItem, registrador, PRNG, limites, replay (ver ENGINE.md §4)
│   │   │   ├── catalog/                   ●  Registro dos itens
│   │   │   ├── testing/                   ●  Apoio a testes: suíte de invariantes (nunca importado por produção)
│   │   │   └── labs/                      ●  Implementações, uma pasta por laboratório
│   │   │       ├── linear/                ●  stack/ (queue/ ○)
│   │   │       ├── linked-lists/          ●  singly-linked-list/ (list.ts = modelo de referência; types, list-state, steps, insert, remove, query + singly-linked-list.ts = item)
│   │   │       ├── sorting/               ○  bubble-sort/, insertion-sort/, merge-sort/
│   │   │       └── searching/             ○  linear-search/, binary-search/
│   │   ├── package.json                   ●  Sem "dependencies"
│   │   ├── tsconfig.json                  ●  Sem lib DOM; types vazio; exactOptionalPropertyTypes
│   │   └── vitest.config.ts               ●  Ambiente Node; limiares de cobertura
│   │
│   └── contracts/                         # @dss/contracts — Zod + tipos de fronteira
│       ├── src/
│       │   ├── index.ts                   ●
│       │   ├── errors.ts                  ○  Códigos de erro e envelope
│       │   ├── pagination.ts              ○
│       │   ├── auth.ts                    ○
│       │   ├── projects.ts                ○
│       │   ├── simulations.ts             ○
│       │   └── simulation-document.ts     ○  Documento persistido (API.md §4)
│       ├── package.json                   ●
│       ├── tsconfig.json                  ●
│       └── vitest.config.ts               ●
│
├── docs/
│   ├── product/                           ✔  Existe (PROJECT_OVERVIEW.md)
│   ├── requirements/                      ✔  Existe (REQUIREMENTS, USE_CASES, USER_FLOWS)
│   └── architecture/                      ✔  Existe (ARCHITECTURE, DATABASE, API, PROJECT_STRUCTURE)
│       └── DECISIONS/                     ✔  Existe (ADR-0001 a ADR-0014)
│
├── infra/
│   ├── Dockerfile                         ○  Imagem única do app (quando houver o que empacotar)
│   └── compose.yaml                       ●  PostgreSQL de desenvolvimento; perfil completo depois
│
├── e2e/                                   ○  Playwright; pacote @dss/e2e (criado com o 1º fluxo vertical)
│
├── .editorconfig                          ●
├── .env.example                           ●
├── .gitattributes                         ●
├── .gitignore                             ●
├── .dockerignore                          ○  Junto com o Dockerfile
├── .npmrc                                 ●
├── .nvmrc                                 ●
├── .prettierignore                        ●
├── .prettierrc.json                       ●
├── CONTRIBUTING.md                        ●  Curto; aponta para este documento
├── eslint.config.js                       ●  Configuração única (flat config), com regras por pasta
├── LICENSE                                ❓  Q71
├── package.json                           ●  Raiz privada: scripts e ferramentas
├── pnpm-lock.yaml                         ⊘→ versionado (gerado, mas COMMITADO)
├── pnpm-workspace.yaml                    ●  Pacotes e catálogo de versões
├── README.md                              ●
└── tsconfig.base.json                     ●
```

> **`pnpm-lock.yaml`** é **gerado**, mas **deve ser versionado** (reprodutibilidade, `--frozen-lockfile` na CI).
> **Observação sobre o `eslint.config.js`:** é um dos poucos arquivos JavaScript do repositório (a ferramenta o lê em JavaScript). Regra de ADR-0014: JavaScript só para configurações exigidas pelas ferramentas.

---

## 5. Responsabilidade de cada pasta

### 5.1 Topo

| Pasta | Responsabilidade | Depende de | O que **não** pode conter |
|---|---|---|---|
| **`apps/web`** | Interface: telas, visualização, estado do laboratório, cliente HTTP | `engine`, `contracts` | Acesso a banco; regras de negócio de algoritmos; importar `apps/api` |
| **`apps/api`** | HTTP, autenticação, projetos, simulações, persistência | `contracts` (e `engine` se Q53/Q37 for adotada) | React; importar `apps/web`; lógica de visualização |
| **`packages/engine`** | **Regras de negócio** do domínio: estruturas, algoritmos, execução em passos, determinismo, limites, validação de operações | **nada** | DOM, Node, React, Express, Prisma, Zod, `Date`, `Math.random`, texto em linguagem natural |
| **`packages/contracts`** | Schemas Zod e tipos de fronteira (HTTP e documento de simulação), catálogo de códigos de erro | `engine` | React, Express, Prisma |
| **`docs`** | Documentação do produto, requisitos e arquitetura | — | Código-fonte |
| **`infra`** | Configuração de infraestrutura (contêineres e, no futuro, implantação) | — | Código de aplicação; segredos |
| **`.github`** | Automações do repositório: CI, atualização de dependências, modelo de PR | — | Lógica do produto |
| **`e2e`** (○) | Testes ponta a ponta pela interface | **nenhum código do projeto** | Importar de `apps` ou `packages` |

### 5.2 `apps/api/src`

| Pasta | Responsabilidade | Observação |
|---|---|---|
| `main.ts` | Liga o servidor (`listen`), lê a configuração, trata sinais de encerramento | Fino; sem lógica |
| `app.ts` | **Constrói** a aplicação Express e a devolve | Separado de `listen` para testar em porta efêmera (ADR-0008) |
| `config/` | Lê e **valida** variáveis de ambiente; falha na subida se faltarem | Único lugar que lê `process.env` |
| `db/` | Instância do cliente Prisma | Só é importada por repositórios |
| `http/` | Preocupações **transversais**: tratador de erros, resolução de sessão, verificação de origem, limites de taxa, identificador de requisição, cabeçalhos de segurança | Arquivos planos; sem subpastas |
| `lib/` | Utilitários mínimos e neutros (relógio injetável, erros de domínio) | **Não** vira "caixa de ferramentas"; ver regra na seção 6.4 |
| `modules/<nome>/` | Um módulo por funcionalidade (`auth`, `projects`, `simulations`, `health`) | Mesma estrutura em cada um (seção 6.2) |
| `prisma/` | Schema e migrations | Migrations geradas, revisadas e versionadas |
| `test/` | **Apoio** a testes de integração (preparar/limpar banco, subir servidor) | Os testes em si ficam **ao lado do código** |

### 5.3 `apps/web/src`

| Pasta | Responsabilidade | Observação |
|---|---|---|
| `main.tsx` | Monta o aplicativo | Fino |
| `app/` | **Composição**: providers, roteador, páginas (T-01 a T-09), guardas de rota | Páginas apenas **compõem** features; sem lógica própria |
| `features/<nome>/` | Funcionalidade completa: componentes, hooks, modelo/estado e acesso à API daquela funcionalidade | Cada feature expõe uma **API pública** por `index.ts` |
| `features/lab/` | Sessão de laboratório: store, reprodução, painel de operações, controles, histórico, contadores | Núcleo do produto (ADR-0010) |
| `features/visualizers/` | Um visualizador SVG **por tipo visual** (sequência, pilha, fila, lista ligada) com layout puro | Nunca por item (ADR-0011) |
| `features/auth/` | Cadastro, login, logout, reautenticação (D-05) | — |
| `features/projects/` | Projetos e simulações salvas (listar, criar, editar, excluir, salvar, reabrir) | — |
| `content/<idioma>/` | Mensagens, pseudocódigo e notas de complexidade, tipados contra as chaves da Engine (ADR-0004) | Só dados e funções de formatação de texto |
| `shared/` | Código reutilizável **por mais de uma feature**: cliente HTTP (`api/`), componentes básicos (`ui/`), hooks e utilitários puros | Só entra aqui o que já é usado por 2+ features |
| `styles/` | Estilos globais e configuração de *design tokens* | — |

### 5.4 `packages/engine/src`

| Pasta | Responsabilidade |
|---|---|
| `index.ts` | **Única** porta de entrada pública (catálogo, execução, reprodução, PRNG, limites, tipos) |
| `core/` | Tipos de Passo/Execução, **registrador de passos**, contadores, PRNG, limites, validação de entradas, erros de invariante |
| `catalog/` | Registro dos itens e seus descritores (operações, tipo visual, complexidade, âncoras) |
| `labs/<laboratório>/<item>/` | Implementação de cada item (estrutura real + instrumentação). Um arquivo de implementação e seus testes por item |

### 5.5 `packages/contracts/src`

Arquivos **planos por domínio** (`auth.ts`, `projects.ts`, `simulations.ts`, `simulation-document.ts`, `errors.ts`, `pagination.ts`) e `index.ts`. Sem subpastas: o pacote é pequeno.

### 5.6 `docs`, `infra`, `.github`

- **`docs/`** mantém as três pastas existentes. **Nenhuma pasta nova** é criada agora. Convenções de desenvolvimento ficam **neste documento** e em um `CONTRIBUTING.md` curto na raiz.
- **`infra/`** plana: `compose.yaml` (PostgreSQL de desenvolvimento; depois perfil completo) e `Dockerfile` (quando houver o que empacotar). Subpastas só quando houver outra tecnologia (ex.: implantação em um provedor).
- **`.github/`**: `workflows/ci.yml`, `dependabot.yml` e `pull_request_template.md`. Sem `ISSUE_TEMPLATE`, `CODEOWNERS` ou `FUNDING` (sem necessidade num projeto de uma pessoa).

---

## 6. Separação entre componentes, serviços e regras de negócio

### 6.1 Princípio

> **Quem decide, quem apresenta e quem comunica são coisas diferentes.**
> - **Regra de negócio** decide *o que é correto* e não sabe como será exibido nem armazenado.
> - **Componente** decide *como aparece* e não sabe como se calcula nem como se busca.
> - **Serviço** decide *como falar com o mundo externo* (rede, armazenamento) e não conhece telas.

**Teste prático para saber onde algo pertence:**

| Se a regra… | Ela vive em |
|---|---|
| …pode mudar o **resultado ou os passos** de um algoritmo, os limites ou a validação de uma operação | **`packages/engine`** |
| …muda **quem pode acessar** ou **o que pode ser gravado** (propriedade, cotas, sessão, senha) | **serviços de `apps/api`** |
| …muda **apenas como aparece** (formato, cor, texto, layout) | **`apps/web`** (componentes, `content/`, layout) |
| …muda **como a tela reage** a uma ação (reproduzir, pausar, cursor) | **modelo/estado** da feature em `apps/web` |

### 6.2 Camadas no Front-end

| Camada | Onde fica | Responsabilidade | Pode importar | **Não** pode |
|---|---|---|---|---|
| **Página** | `app/pages` | Compor features para uma rota | features | Lógica, `fetch`, Engine |
| **Componente** | `features/*/components`, `shared/ui` | Apresentação: recebe **props**, dispara **callbacks** | `shared/ui`, tipos, `content` | `fetch`, Engine, store diretamente em componentes "burros" de `shared/ui` |
| **Hook** | `features/*/hooks`, `shared/hooks` | Ligar React ao modelo e aos serviços (temporizador, consultas) | modelo, serviços | Regra de negócio |
| **Modelo / estado** | `features/*/model` | Store Zustand, *reducers*, seletores; **regras de aplicação** (transições de reprodução) | **Engine**, tipos | React, `fetch`, DOM |
| **Serviço (API)** | `features/*/api`, `shared/api` | Chamadas HTTP e (de)serialização; funções assíncronas puras | `contracts` | React, store |
| **Conteúdo** | `content/` | Textos e pseudocódigo, tipados contra a Engine | tipos da Engine | Lógica |

Estrutura **interna de uma feature** (criada **só quando necessária**; começa plana e se divide quando passar de ~7 arquivos):

```text
features/<nome>/
├── components/     Componentes da feature
├── hooks/          Hooks da feature
├── model/          Store, reducers, seletores
├── api/            Chamadas HTTP e hooks de consulta/mutação
└── index.ts        API PÚBLICA da feature (o resto é privado)
```

### 6.3 Camadas na API

| Camada | Arquivo | Responsabilidade | Pode importar | **Não** pode |
|---|---|---|---|---|
| **Rotas** (adaptador HTTP) | `<módulo>.routes.ts` | Mapear verbo e caminho, validar com `contracts`, chamar o serviço, formatar resposta | serviço, `contracts`, `http/` | Prisma, regra de negócio |
| **Serviço** (regras) | `<módulo>.service.ts` | Regras de negócio e casos de uso | repositório, `lib/`, `contracts`, (Engine) | `express`, `req`/`res`, cookies |
| **Repositório** (dados) | `<módulo>.repository.ts` | **Único** lugar que usa o Prisma; **sempre filtra pelo usuário** | `db/` | Serviços, regras de negócio |
| **Transversais** | `http/` | Middlewares e tratador de erros | `lib/`, `config/` | Regras de negócio |
| **Configuração** | `config/` | Variáveis de ambiente validadas | — | — |

### 6.4 Regras de importação (impostas por lint)

```mermaid
flowchart TD
    subgraph WEB["apps/web"]
        PG["app/pages"] --> FE["features/*"]
        FE --> SH["shared/*"]
        FE --> CT["content"]
        FE -.->|"somente o modelo/estado"| ENG1["@dss/engine"]
        FE -.->|"somente serviços de API"| CON1["@dss/contracts"]
    end
    subgraph APIAPP["apps/api"]
        RT["modules/*.routes"] --> SV["modules/*.service"]
        SV --> RP["modules/*.repository"]
        RP --> DB["db/"]
        RT --> HT["http/"]
        SV -.->|"opcional: Q53"| ENG2["@dss/engine"]
        RT -.-> CON2["@dss/contracts"]
    end
```

| Regra | Como é imposta |
|---|---|
| Nada importa **para cima** nas camadas (ex.: repositório não importa serviço) | `no-restricted-imports` por pasta |
| `apps/web` **não** importa `apps/api`, e vice-versa | Idem + dependências declaradas |
| Código externo a uma feature importa **somente** o `index.ts` da feature (sem *deep imports*) | `no-restricted-imports` com padrões |
| Pacotes são importados **só pela entrada pública** (`@dss/engine`, `@dss/contracts`), nunca por caminho interno | Campo `exports` dos pacotes |
| Em `packages/engine`: proibidos `Date`, `Math.random`, `Array.prototype.sort` e importações externas | `no-restricted-globals`, `no-restricted-properties`, `no-restricted-syntax`, `no-restricted-imports` |
| `process.env` só em `apps/api/src/config` | `no-restricted-properties` |
| Sem dependências circulares | `tsc` e revisão; plugin só se necessário (ADR-0014) |
| `lib/` e `shared/` **só** recebem o que for usado por 2+ consumidores | Revisão de PR |

> **Por que apenas recursos nativos do ESLint:** evitam novos *plugins* (ADR-0014). Se não bastarem, a adição de um plugin de fronteiras será **justificada em ADR** antes de entrar.

### 6.5 Testes ao lado do código

| Tipo | Local e nome | Exemplo |
|---|---|---|
| Unitário | Ao lado do arquivo, `*.test.ts(x)` | `bubble-sort.test.ts` |
| Integração da API (usa banco) | Ao lado do módulo, `*.integration.test.ts` | `projects.integration.test.ts` |
| Apoio a testes da API | `apps/api/test/` | Preparar/limpar banco |
| E2E | `e2e/`, `*.spec.ts` | `save-and-reopen.spec.ts` |

A separação por **sufixo** evita criar pastas `__tests__` e permite rodar apenas os testes rápidos.

---

## 7. Convenções de nomenclatura

### 7.1 Idioma (❓ Q65)

| Elemento | Idioma recomendado |
|---|---|
| Identificadores, comentários, nomes de arquivos, mensagens de commit | **Inglês** |
| Documentação em `docs/`, `README`, textos da interface, explicações dos passos | **Português (pt-BR)** |
| **Rotas da interface** (URLs que a pessoa vê) | Português (`/laboratorios`, conforme `USER_FLOWS.md`) |
| **Rotas da API** e nomes de recursos | Inglês (`/api/projects`) |

**Por que:** vocabulário de programação e *Conventional Commits* já são em inglês; portfólio internacional; a interface continua em português para o público-alvo. Alternativa: tudo em português, ao custo de mistura com termos técnicos.

### 7.2 Arquivos e pastas

| Tipo | Convenção | Exemplo |
|---|---|---|
| Pastas | `kebab-case` | `linked-lists`, `step-recorder` |
| Arquivos TypeScript gerais | `kebab-case.ts` | `step-recorder.ts`, `password-hasher.ts` |
| **Componentes React** | `PascalCase.tsx` (um componente por arquivo) | `PlaybackControls.tsx` |
| Hooks | `useCamelCase.ts` | `usePlayback.ts` |
| Store, reducer, seletores | `nome.store.ts`, `nome.reducer.ts`, `nome.selectors.ts` | `lab-session.store.ts` |
| Módulo da API | `modulo.routes.ts`, `modulo.service.ts`, `modulo.repository.ts` | `projects.service.ts` |
| Testes | `nome.test.ts(x)`, `nome.integration.test.ts`, `nome.spec.ts` (E2E) | `bubble-sort.test.ts` |
| Documentos | `MAIUSCULAS_COM_SUBLINHADO.md` (já em uso) | `PROJECT_STRUCTURE.md` |
| ADRs | `ADR-NNNN-assunto-em-kebab-case.md` | `ADR-0015-...md` |
| Arquivos de configuração | Nome padrão da ferramenta | `tsconfig.json` |

### 7.3 Código

| Elemento | Convenção | Exemplo |
|---|---|---|
| Variáveis, funções | `camelCase` | `createInitialState` |
| Tipos, *interfaces*, componentes | `PascalCase`, **sem** prefixo `I` | `Execution`, `StepControlsProps` |
| Constantes de configuração exportadas | `UPPER_SNAKE_CASE` | `LIMITS`, `DEFAULT_PAGE_SIZE` |
| Booleanos | Prefixo `is`, `has`, `can`, `should` | `canStepBack` |
| *Handlers* | `onX` (propriedade), `handleX` (implementação) | `onStep`, `handleStep` |
| Schemas Zod e tipos inferidos | `xxxSchema` e `Xxx` | `createProjectSchema`, `CreateProject` |
| DTOs da API | Sufixo `Dto` | `ProjectDto` |
| Erros | Sufixo `Error` | `EngineInvariantError` |
| Hooks de store Zustand | `useXxxStore` | `useLabSessionStore` |
| **`enum` do TypeScript** | **Evitar**: usar união de literais (`'manual' \| 'random'`) ou objeto `as const` | — |
| Exportações | **Nomeadas**; `export default` só onde a ferramenta exigir | — |
| *Barrel files* | **Somente** `index.ts` na raiz de um pacote ou feature (API pública) | — |
| Importações de tipos | `import type` | — |

### 7.4 Identificadores de domínio

| Elemento | Convenção | Exemplo |
|---|---|---|
| Laboratório (`labId`) | `kebab-case` | `sorting`, `linked-lists` |
| Item (`itemId`) | `kebab-case` | `bubble-sort`, `singly-linked-list` |
| Tipos de operação | `camelCase` | `insertAt`, `removeValue` |
| Chaves de mensagem e âncoras (ADR-0004) | `lab.item.evento` em minúsculas e pontos | `sorting.bubble.compare` |
| Variáveis de ambiente | `UPPER_SNAKE_CASE`; públicas do Web com prefixo `VITE_` | `DATABASE_URL`, `VITE_APP_NAME` |
| Banco de dados | `snake_case` (`DATABASE.md`) | `password_hash` |

### 7.5 Pacotes

Escopo `@dss/` (privado, **não publicado**): `@dss/web`, `@dss/api`, `@dss/engine`, `@dss/contracts` e, depois, `@dss/e2e` (❓ Q66). O escopo é curto para importações legíveis.

---

## 8. Como os pacotes compartilham dependências

### 8.1 Princípios (pnpm Workspaces)

1. **Pacotes internos por `workspace:*`**: `@dss/web` depende de `@dss/engine` assim.
2. **Cada pacote declara o que importa**, inclusive o que também é dependência de outro pacote (o modo estrito do pnpm **impede** importar o que não foi declarado). Ex.: `apps/api` declara `zod` se o importar diretamente, mesmo que `contracts` já o tenha.
3. **Versões compartilhadas por catálogo** (❓ Q70): `pnpm-workspace.yaml` define o `catalog:` com **uma** versão de cada dependência comum (React, Zod, TypeScript, Vitest…); os pacotes escrevem `"catalog:"` em vez de repetir a versão. Elimina divergência de versões. Requer pnpm com suporte a catálogos (versões atuais têm).
4. **Ferramentas transversais na raiz**: TypeScript, ESLint, Prettier são `devDependencies` do `package.json` **da raiz** e rodam a partir dela. Cada pacote declara as ferramentas que **ele próprio executa** (ex.: Vitest, Vite).
5. **Versões exatas**: `.npmrc` com `save-exact` (ADR-0014: versões fixadas). Atualizações por Dependabot, em PRs dedicados.
6. **`pnpm-lock.yaml` versionado**; a CI usa instalação com `--frozen-lockfile`.
7. **Sem *hoisting* implícito**: nenhuma configuração para "elevar" pacotes (`shamefully-hoist` proibido).
8. **`overrides`** do pnpm **só** para correção de vulnerabilidade, com comentário e prazo de remoção.
9. **A Engine não tem `dependencies`** (ADR-0002); suas ferramentas de teste são `devDependencies` e **não** são importadas pelo código-fonte.
10. **ESM em todo o repositório** (`"type": "module"`).

### 8.2 Matriz de dependências planejadas (💡 sujeita à aprovação de Q43)

Legenda: **P** = dependência de produção · **D** = de desenvolvimento · **—** = não usa.
Dependências **internas**: `web → engine, contracts` · `api → contracts` (e `engine`, se Q53) · `contracts → engine`.

| Dependência | raiz | web | api | engine | contracts |
|---|:-:|:-:|:-:|:-:|:-:|
| TypeScript | D | — | — | — | — |
| ESLint, typescript-eslint, Prettier | D | — | — | — | — |
| Vitest | — | D | D | D | D |
| `@vitest/coverage-v8` | — | — | — | D | — |
| React, React DOM | — | P | — | — | — |
| React Router | — | P | — | — | — |
| Zustand | — | P | — | — | — |
| TanStack Query (opcional, Q36) | — | P | — | — | — |
| Tailwind CSS (e plugin do Vite) | — | D | — | — | — |
| Vite, plugin React | — | D | — | — | — |
| Testing Library, jsdom | — | D | — | — | — |
| Express | — | — | P | — | — |
| Prisma (cliente) e Prisma CLI | — | — | P / D | — | — |
| Helmet, express-rate-limit | — | — | P | — | — |
| Zod | — | — | P | — | P |
| `tsx` (dev) e `tsup` (build) — depende de Q38 | — | — | D | — | — |
| Playwright | — | — | — | — | — (vai em `e2e`) |

- **Sem `dotenv`:** o Node lê arquivos de ambiente nativamente (`--env-file`); em produção as variáveis vêm do ambiente (ADR-0014).
- **Sem biblioteca de log, de datas, de utilitários (lodash) ou de HTTP (Axios)** nesta fase.

### 8.3 Grafo de dependências entre pacotes

```mermaid
flowchart BT
    ENG["packages/engine: sem dependências"]
    CON["packages/contracts"]
    WEB["apps/web"]
    API["apps/api"]
    E2E["e2e: depois"]
    CON --> ENG
    WEB --> ENG
    WEB --> CON
    API --> CON
    API -.->|"opcional: Q53"| ENG
    E2E -.->|"não importa código"| WEB
```

### 8.4 Consumo dos pacotes internos (❓ Q38)

Opção recomendada (ADR-0001): pacotes "*just-in-time*": o campo `exports` de cada pacote aponta para o **código-fonte TypeScript**; o Vite compila o que o Web importa; a API roda com `tsx` em desenvolvimento e é empacotada em produção incluindo os pacotes do workspace. **Vantagem:** sem *build* intermediário. **A validar numa prova de conceito no setup**, como já previsto.

---

## 9. Configurações compartilhadas

### 9.1 O que é compartilhado, e como

| Configuração | Arquivo (raiz) | Como cada pacote usa | Conteúdo-chave (conceitual) |
|---|---|---|---|
| **TypeScript base** | `tsconfig.base.json` | Cada `tsconfig.json` **estende** a base | `strict`; `noUncheckedIndexedAccess` (**especialmente valioso** para o código de algoritmos com vetores); `noImplicitOverride`; `noFallthroughCasesInSwitch`; `verbatimModuleSyntax`; `isolatedModules`; `skipLibCheck`; resolução de módulos no modo de *bundler* |
| **TypeScript por pacote** | `<pkg>/tsconfig.json` | Especializa a base | **Engine:** apenas bibliotecas de linguagem (sem DOM), `types` vazio. **Web:** DOM + tipos do Vite. **API:** tipos do Node |
| **ESLint** | `eslint.config.js` | **Um** arquivo para o repositório; blocos por pasta com regras específicas | Regras de fronteira (seção 6.4); proibições da Engine; `no-explicit-any` (exceção justificada por comentário); regras de React no Web |
| **Prettier** | `.prettierrc.json`, `.prettierignore` | Raiz; executado a partir dela | Formato único; sem discussões de estilo |
| **EditorConfig** | `.editorconfig` | Editores | Fim de linha LF, UTF-8, indentação, nova linha final |
| **Fim de linha** | `.gitattributes` | Git | Normalização para LF (evita ruído em Windows/macOS/Linux) |
| **Versões do Node e do pnpm** | `.nvmrc`; campos `packageManager` e `engines` do `package.json` raiz; `.npmrc` com `engine-strict` | Todos | A mesma versão local, em CI e Docker |
| **Versões de dependências** | `pnpm-workspace.yaml` (catálogo) | `"catalog:"` | Uma versão por dependência comum |
| **Variáveis de ambiente** | `.env.example` (raiz) | API e Compose | Seção 12.3 |
| **CI** | `.github/workflows/ci.yml` | Todo o repositório | Seção 13 |

### 9.2 O que **não** é compartilhado

| Item | Por quê |
|---|---|
| `vite.config.ts` (com Vitest do Web) | Só o Web usa Vite |
| `vitest.config.ts` | Ambientes diferentes (Node na Engine, `contracts` e API; navegador simulado no Web); a Engine tem limiares de cobertura |
| `prisma/` e `prisma.config.ts` | Só a API usa |
| Configuração do Tailwind | Só o Web usa |

### 9.3 Por que **não** um pacote `config` (ex.: `@dss/config`)

ADR-0001 rejeitou pacotes extras sem reuso real. Com quatro unidades de código, um arquivo base na raiz basta; um pacote `config` só se justificaria com **muitas** configurações replicadas.

### 9.4 Scripts: nomes padronizados

**Raiz** (orquestram, não contêm lógica): `dev`, `build`, `typecheck`, `lint`, `format`, `format:check`, `test`, `test:coverage`, `check` (tudo o que a CI roda, na ordem), `db:*` (migrações e *studio*, delegando à API), `infra:up`, `infra:down`.
**Por pacote** (mesmos nomes, quando aplicável): `dev`, `build`, `typecheck`, `test`.
**Regras:** o `lint` roda **uma vez**, da raiz; scripts **sem dependência de *shell* específico** (o desenvolvimento pode ocorrer em Windows, macOS ou Linux); `pnpm check` local equivale à CI.

---

## 10. Convenções de branches

### 10.1 Modelo (❓ Q67)

**Desenvolvimento baseado em tronco, com ramos curtos.**

| Ramo | Uso | Vida |
|---|---|---|
| **`main`** | Sempre **estável e implantável**; protegido | Permanente |
| **`<tipo>/<descrição-curta>`** | Uma mudança coesa | **Curta** (idealmente dias) e apagado após o *merge* |

**Sem `develop` e sem GitFlow:** o projeto é mantido por uma pessoa e tem CI; ramos de longa duração só acrescentam *merges* e atrasam o *feedback*.

### 10.2 Nomes de ramos

Formato: `tipo/escopo-descrição-em-kebab-case` (opcionalmente com número da *issue*).

| Tipo | Uso | Exemplo |
|---|---|---|
| `feat` | Funcionalidade nova | `feat/engine-step-recorder` |
| `fix` | Correção | `fix/api-session-expiry` |
| `docs` | Documentação | `docs/project-structure` |
| `refactor` | Reestruturação sem mudar comportamento | `refactor/web-playback-reducer` |
| `test` | Testes | `test/engine-sorting-properties` |
| `chore` | Manutenção, ferramentas | `chore/repo-scaffolding` |
| `ci` | CI e automações | `ci/add-coverage-gate` |
| `build` | Build e empacotamento | `build/docker-image` |
| `perf` | Desempenho | `perf/visualizer-layout` |

### 10.3 Proteção de `main` (💡, no GitHub)

- Exigir **PR** e **CI verde** para entrar.
- Proibir *force push* e exclusão do ramo.
- Exigir ramo **atualizado** antes do *merge*.
- Fazer o *merge* por **squash** (um commit por PR) e **apagar o ramo** depois.
- Aprovação de revisor **não** obrigatória (projeto individual); o PR continua útil como registro, *checklist* e porta da CI.

### 10.4 Ciclo de uma mudança

```mermaid
flowchart LR
    A["Ramo curto a partir de main"] --> B["Commits pequenos e coesos"]
    B --> C["Pull request com título no padrão"]
    C --> D{"CI verde?"}
    D -->|"Não"| B
    D -->|"Sim"| E["Squash merge em main"]
    E --> F["Apagar o ramo"]
```

### 10.5 Versionamento e marcos

- *Tags* `v0.x.y` para marcos do MVP (versionamento semântico, ainda sem compromisso de estabilidade antes da `1.0`).
- Sem automação de *release* agora.

---

## 11. Convenções de commits

### 11.1 Formato: Conventional Commits 1.0

```text
tipo(escopo): descrição curta no imperativo

Corpo opcional explicando o POR QUÊ (e não o quê).

Rodapé opcional: Closes #12
```

| Elemento | Regra |
|---|---|
| **Tipos** | `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `build`, `ci`, `perf`, `revert` |
| **Escopos** | `web`, `api`, `engine`, `contracts`, `infra`, `docs`, `repo` (raiz), `deps` |
| **Descrição** | Imperativo (`add`, `fix`, `remove`), minúscula inicial, sem ponto final, **até ~72 caracteres** |
| **Corpo** | Linhas de até ~72 caracteres; explica a motivação e decisões |
| **Mudança incompatível** | `!` após o escopo **e** rodapé `BREAKING CHANGE:` |
| **Referências** | IDs de requisito e ADR no corpo (`Refs: RF-020, ADR-0003`) |
| **Atomicidade** | Cada commit **compila e passa nos testes** |

**Exemplos**

```text
feat(engine): add step recorder with shared counters
fix(api): reject mutations without a valid origin header
docs(architecture): propose monorepo structure
chore(deps): bump vitest from 5.1.0 to 5.1.1
refactor(web)!: rename lab session store actions

BREAKING CHANGE: runOperation was renamed to execute.
```

### 11.2 Como é verificado (❓ Q68)

| Opção | Custo | Recomendação |
|---|---|---|
| **A. Título do PR validado na CI** (expressão regular em um passo do *workflow*) + *squash merge* | **Zero dependências**; o que importa é o commit final em `main` | ✅ **Recomendada** |
| B. `commitlint` + `husky` (ganchos locais) | 2+ dependências e configuração; valida commits intermediários que serão descartados no *squash* | ⏳ Só se houver necessidade |
| C. Apenas convenção, sem verificação | Nenhum custo, nenhuma garantia | ❌ |

**Com *squash merge*, o título do PR vira a mensagem do commit em `main`**; por isso **o título do PR deve seguir o formato**. O Dependabot é configurado para gerar mensagens com `chore(deps)`.

### 11.3 Modelo de PR (`.github/pull_request_template.md`)

Conteúdo previsto (checklist): o que muda e por quê; requisitos/ADR relacionados (`RF-…`, `ADR-…`); como testar; **testes** adicionados ou atualizados; **documentação** atualizada; **ADR** criado se a mudança é estrutural; sem segredos; CI verde.

---

## 12. Arquivos essenciais

### 12.1 Tabela

| Arquivo | Onde | Finalidade | Criação |
|---|---|---|---|
| **`.gitignore`** | raiz | Impede versionar arquivos gerados, dependências e **segredos** | ● |
| **`.env.example`** | raiz | **Modelo** das variáveis de ambiente, **sem segredos reais** | ● |
| `.gitattributes` | raiz | Normalizar fim de linha (LF) | ● |
| `.editorconfig` | raiz | Padrão de editor | ● |
| `.nvmrc` | raiz | Versão do Node (ver seção 15) | ● |
| `.npmrc` | raiz | `engine-strict`, `save-exact` | ● |
| `package.json` | raiz | Privado; scripts; ferramentas; `packageManager`; `engines` | ● |
| `pnpm-workspace.yaml` | raiz | Lista de pacotes e **catálogo** de versões | ● |
| `pnpm-lock.yaml` | raiz | Reprodutibilidade (**versionado**) | ● (gerado) |
| `tsconfig.base.json` | raiz | Base do TypeScript | ● |
| `eslint.config.js` | raiz | Lint do repositório | ● |
| `.prettierrc.json`, `.prettierignore` | raiz | Formatação | ● |
| `README.md` | raiz | Visão geral, requisitos de ambiente, **comando único** para subir, scripts, links para a documentação | ● |
| `CONTRIBUTING.md` | raiz | Resumo das convenções (branches, commits, testes) com link para este documento | ● |
| `LICENSE` | raiz | Licença do repositório | ❓ Q71 |
| `.github/workflows/ci.yml` | `.github` | Pipeline (ADR-0013) | ● |
| `.github/dependabot.yml` | `.github` | Atualizações automatizadas | ● |
| `.github/pull_request_template.md` | `.github` | Checklist de PR | ● |
| `infra/compose.yaml` | `infra` | PostgreSQL de desenvolvimento (perfil completo depois) | ● |
| `infra/Dockerfile`, `.dockerignore` | `infra`, raiz | Imagem do app | ○ |
| `package.json`, `tsconfig.json`, `vitest.config.ts` | cada pacote | Configuração local | ● |

### 12.2 `.gitignore` — categorias previstas

| Categoria | Padrões (exemplos) |
|---|---|
| Dependências | `node_modules/` |
| Saídas de build | `dist/`, `build/`, `*.tsbuildinfo` |
| Testes e cobertura | `coverage/`, `playwright-report/`, `test-results/` |
| **Segredos e ambiente** | `.env`, `.env.*` **exceto** `.env.example` |
| Gerados | `**/generated/` (cliente Prisma) |
| Logs | `*.log`, `npm-debug.log*`, `pnpm-debug.log*` |
| Editor e sistema | `.DS_Store`, `Thumbs.db`, `.idea/` e configurações **pessoais** do editor |
| Caches | `.vite/`, `.eslintcache`, `.cache/` |

> **Não** se ignoram: `pnpm-lock.yaml`, `.env.example`, `prisma/migrations/`.

### 12.3 `.env.example` — variáveis previstas

Um **único** `.env.example` na raiz (a API e o Compose o usam; o Web não tem segredos). Valores são **apenas para desenvolvimento local**.

| Variável | Para quê | Valor de exemplo |
|---|---|---|
| `NODE_ENV` | Modo de execução | `development` |
| `PORT` | Porta da API | `3000` |
| `APP_ORIGIN` | **Origem permitida** para mutações (verificação de `Origin`, `API.md` §2.3). No desenvolvimento é a do servidor do Vite | `http://localhost:5173` |
| `DATABASE_URL` | Conexão com o banco | `postgresql://dss:dss@localhost:5432/dss` |
| `TEST_DATABASE_URL` | Banco dos testes de integração | `postgresql://dss:dss@localhost:5432/dss_test` |
| `SESSION_TTL_DAYS` | Duração da sessão (Q11) | `7` |
| `COOKIE_SECURE` | Cookie `Secure` (verdadeiro em produção) | `false` |
| `LOG_LEVEL` | Detalhe do registro | `info` |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | Usados pelo `compose.yaml` | `dss`, `dss`, `dss` |

**Regras**
- **Não existe `SESSION_SECRET`:** as sessões são tokens aleatórios guardados (por *hash*) no banco (ADR-0009); não há chave de assinatura a proteger.
- `.env.example` **nunca** contém segredo real; `.env` está no `.gitignore`.
- A API **valida** as variáveis na subida e falha se algo faltar (`apps/api/src/config`).
- Variáveis do Web só podem ter prefixo `VITE_` e **são públicas** (vão para o navegador).
- **Compose e `.env`:** o Compose procura `.env` no diretório do projeto, que é o do arquivo `compose.yaml` (`infra/`). Para ler o `.env` da raiz, o comando usa `--project-directory .` (encapsulado em `pnpm infra:up`) — ver ❓ Q69.

---

## 13. Escopo do *scaffolding* após a aprovação

### 13.1 O que será criado (●)

Somente o necessário para o repositório **instalar, verificar tipos, aplicar lint, formatar, testar e rodar a CI**:

- **Raiz:** os arquivos ● da seção 12.1.
- **Cada pacote:** `package.json`, `tsconfig.json`, configuração de testes e um `src/index.ts` (ou `main.tsx`/`app.ts`) **mínimo**, com **um teste de fumaça** que prove que o pipeline funciona.
- **API:** `prisma/schema.prisma` (de `DATABASE.md` §8), **sem** gerar migrations.
- **`infra/compose.yaml`:** apenas o PostgreSQL de desenvolvimento.
- **`.github/`:** CI, Dependabot e modelo de PR.

### 13.2 O que **não** será criado

| Item | Quando entra |
|---|---|
| Qualquer **laboratório**, estrutura ou algoritmo | Fases seguintes |
| Pastas `labs/`, `visualizers/`, `modules/*`, `pages/`, `shared/*` vazias | Junto com o primeiro arquivo que as use |
| **Migrations** do Prisma | Após as decisões Q44 a Q48 e Q60 de `DATABASE.md` |
| `Dockerfile` do app e `.dockerignore` | Quando houver algo a empacotar |
| `e2e/` e Playwright | Após o primeiro fluxo vertical |
| `LICENSE` | Após decidir Q71 |

### 13.3 Ordem sugerida de PRs do *scaffolding*

| PR | Conteúdo | Resultado |
|---|---|---|
| 1 | Base do repositório: arquivos de raiz, `.github`, `README`, `CONTRIBUTING` | CI executa (sem pacotes ainda) |
| 2 | `packages/engine` e `packages/contracts` (esqueleto + teste de fumaça) | Regras de fronteira da Engine verificadas |
| 3 | `apps/api` (esqueleto, `schema.prisma`) e `infra/compose.yaml` | API sobe; banco local disponível |
| 4 | `apps/web` (esqueleto Vite + React + Tailwind) | Interface vazia compila e testa |

---

## 14. Riscos da estrutura

| ID | Risco | Mitigação |
|---|---|---|
| **ES-01** | Pastas e abstrações **antes** do uso (excesso de estrutura) | Regra "sob demanda" (○); `shared/` e `lib/` só com 2+ consumidores |
| **ES-02** | Fronteiras de importação **erodidas** com o tempo | Lint com recursos nativos; Engine sem dependências; CI bloqueante |
| **ES-03** | `shared/` e `lib/` viram "depósito" de tudo | Regra de dois consumidores; revisão de PR |
| **ES-04** | Consumo "*just-in-time*" dos pacotes não funcionar bem com a API em produção | PoC no setup (Q38); alternativa `tsc -b` |
| **ES-05** | Incompatibilidades entre versões muito novas de ferramentas (seção 15) | Matriz de compatibilidade e fixação de versões no setup |
| **ES-06** | Variáveis de ambiente do Compose × raiz confundirem o desenvolvedor | Encapsular em scripts; documentar no README (Q69) |
| **ES-07** | Convenções sem verificação automática viram letra morta | Lint, CI e verificação do título do PR |
| **ES-08** | Mistura de idiomas | Regra única de idioma (Q65) |

---

## 15. Achados sobre versões que exigem atenção no setup

Consulta ao registro npm em **14/11/2026** (tag `latest`; **não** foi testada a compatibilidade entre as ferramentas):

| Ferramenta | `latest` observada |
|---|---|
| pnpm | 12.18.0 |
| TypeScript | **7.0.2** (a série 6.x mais recente é 6.0.3) |
| Vite | 8.3.8 |
| Vitest | 5.1.0 |
| React / React DOM | 19.3.1 |
| React Router | 8.5.1 |
| Zustand | 5.1.0 |
| Zod | 4.6.7 |
| Express | 5.3.0 |
| Tailwind CSS | 4.3.5 |
| ESLint | 10.15.0 |
| typescript-eslint | 8.72.2 |
| Prettier | 3.10.1 |
| Playwright | 1.65.1 |
| `@prisma/client` | **7.10.1** |
| `prisma` (CLI) | **8.0.0-rc.33** |
| tsup | 9.0.0 |

**Pontos de atenção**

1. **TypeScript 7 × typescript-eslint.** O `typescript-eslint` declara como compatível o TypeScript `>=4.8.4 <6.1.0`: **não cobre o TypeScript 7**. Opções (❓ Q73): **(a)** fixar **TypeScript 6.0.x** até o suporte chegar (recomendado: mantém ESLint com regras sensíveis a tipos); **(b)** adotar TypeScript 7 e **abrir mão** do `typescript-eslint` (por exemplo, com outra ferramenta de lint, o que reabre Q41). Isso é um fato do **metadado de pares** da ferramenta; o comportamento real não foi testado.
2. **Prisma: CLI e cliente em descompasso.** A tag `latest` do **`prisma` (CLI) aponta para uma versão candidata a lançamento (8.0.0-rc)**, enquanto `@prisma/client` está na **7.10.1**. Instalar "o mais recente" de cada um **mistura versões**. **Fixar CLI e cliente na mesma versão estável** (Q60).
3. **Vite 8 / Vitest 5 / plugin React.** Pelos metadados: Vitest 5.1.0 aceita Vite 6.4, 7 e 8; o plugin React 6.3.0 exige Vite 8; o plugin do Tailwind para o Vite aceita até a 8. Parecem compatíveis, **a confirmar no setup**.
4. **Node.** Não consegui consultar o calendário oficial de versões LTS neste ambiente. Os tipos do Node (`@types/node`) estão na série 26. **Fixar no `.nvmrc` a LTS ativa na data do setup**, verificada em nodejs.org.
5. **tsup.** Sem aviso de descontinuação no registro e com publicação em 14/10/2026; mesmo assim, a escolha entre `tsup` e `tsc -b` segue dependendo da PoC (Q38).

> **Recomendação:** o primeiro PR do *scaffolding* inclui uma **verificação de compatibilidade** (instalar, compilar, lintar, testar) com as versões escolhidas, antes de fixar o catálogo.

---

## 16. Decisões pendentes antes do *scaffolding*

Numeração **continua** a dos documentos anteriores. **Bloqueia setup** = precisa ser decidida antes de criar os arquivos de configuração.

| # | Pergunta | Recomendação | Bloqueia setup? |
|---|---|---|---|
| **Q65** | **Idioma** do código, comentários e commits | Inglês para código e commits; português para docs e interface | Sim |
| **Q66** | **Escopo dos pacotes** (`@dss/`) e **nome do repositório** | `@dss/*`; repositório `datastructure-studio` | Sim |
| **Q67** | **Fluxo de branches:** tronco + ramos curtos, PR com *squash* e proteção de `main`? (exige o repositório no GitHub) | Sim | Não |
| **Q68** | **Verificação de commits:** título do PR na CI (sem dependências) ou `commitlint` + `husky`? | Título do PR na CI | Não |
| **Q69** | **`compose.yaml` em `infra/`** (com `--project-directory`) ou **na raiz**? | `infra/` plana, encapsulada em `pnpm infra:up` | Não |
| **Q70** | **Catálogo do pnpm** (`catalog:`) para versões compartilhadas? | Sim | Sim |
| **Q71** | **Licença** do repositório (herdada do Overview) e `CONTRIBUTING.md` | Decidir licença; `CONTRIBUTING` curto | Não |
| **Q72** | `e2e/` como pacote na raiz (**criado depois**) ou `apps/e2e`? | `e2e/` na raiz | Não |
| **Q73** | **TypeScript 6.0.x** (com `typescript-eslint`) ou **7.x** (sem ele)? | **6.0.x** | **Sim** |

**Pendências anteriores que também bloqueiam ou orientam o setup**

| # | Assunto | Recomendação já registrada |
|---|---|---|
| Q38 | Consumo dos pacotes (*just-in-time* × `tsc -b`) | PoC no setup |
| Q41 | ESLint + Prettier × Biome | ESLint + Prettier (veja Q73) |
| Q43 | Aprovar o conjunto de dependências (seção 8.2) | Sim |
| Q44 | `Project` × `Workspace` | `Project` |
| Q60 | Versão do Prisma e processo de `CHECK` | Fixar CLI e cliente na mesma versão estável |

---

## 17. Rastreabilidade

| Pedido deste prompt | Seção |
|---|---|
| 1. Árvore completa de diretórios | 4 |
| 2. Responsabilidade de cada pasta | 5 |
| 3. Convenções de nomenclatura | 7 |
| 4. Separação entre componentes, serviços e regras de negócio | 6 |
| 5. Compartilhamento de dependências entre pacotes | 8 |
| 6. Configurações compartilhadas | 9 |
| 7. Convenções de branches e commits | 10 e 11 |
| 8. Arquivos essenciais (`.gitignore`, `.env.example` etc.) | 12 |
| Decisões e pendências | 2, 3, 15 e 16 |

| Decisão ou requisito | Onde se materializa |
|---|---|
| ADR-0001 (monorepo, quatro unidades) | Seções 4, 5 e 8 |
| ADR-0002 (Engine pura) | Seções 5.1, 6.4, 8.1 e 9.1 |
| ADR-0007 (contratos) | Seções 5.5 e 8.2 |
| ADR-0008 (API em camadas) | Seção 6.3 |
| ADR-0013 (testes e CI) | Seções 6.5 e 13 |
| ADR-0014 (dependências) | Seções 6.4, 8 e 11.2 |
| RNF-021 (padrão de código) | Seção 9 |
| RNF-022 (documentação) | Seção 12 (`README`, `CONTRIBUTING`) |
| RNF-024 (subir com um comando) | Seções 12.3 e 13 |
| RNF-006 (sem segredos no repositório) | Seções 12.2 e 12.3 |

---

*Fim do documento. Os arquivos de configuração só serão criados após a sua aprovação.*
