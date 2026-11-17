# Registros de Decisões Arquiteturais (ADR)

Cada ADR registra **uma** decisão: o contexto que a motivou, o que foi decidido, o que foi considerado e descartado, a justificativa e as consequências. Servem para que, meses depois, qualquer pessoa (inclusive o próprio autor) entenda **por que** o sistema é assim.

Visão geral e diagramas: [`../ARCHITECTURE.md`](../ARCHITECTURE.md).

## Índice

| ADR | Título | Status |
|---|---|---|
| [0001](ADR-0001-monorepo-pnpm-workspaces.md) | Monorepo com pnpm Workspaces e quatro unidades | Proposta |
| [0002](ADR-0002-engine-typescript-puro.md) | Engine em TypeScript puro, sem dependências | **Aceita** |
| [0003](ADR-0003-modelo-de-execucao-snapshots.md) | Modelo de execução: *snapshots* imutáveis, geração *eager* | Proposta |
| [0004](ADR-0004-conteudo-didatico-chaves-e-ancoras.md) | Conteúdo didático por chaves e âncoras | Proposta |
| [0005](ADR-0005-execucao-no-navegador.md) | Simulações executam no navegador | **Aceita** |
| [0006](ADR-0006-formato-persistido-da-simulacao.md) | Formato persistido da simulação | Proposta |
| [0007](ADR-0007-contratos-compartilhados.md) | Contratos compartilhados com Zod | Proposta |
| [0008](ADR-0008-api-em-camadas-e-erros.md) | API em camadas e envelope de erro | Proposta |
| [0009](ADR-0009-autenticacao-sessao-no-banco.md) | Autenticação por sessão no PostgreSQL | Proposta |
| [0010](ADR-0010-gerenciamento-de-estado-no-front-end.md) | Gerenciamento de estado no Front-end | Proposta |
| [0011](ADR-0011-renderizacao-svg.md) | Renderização em SVG com React | Proposta |
| [0012](ADR-0012-topologia-e-docker.md) | Topologia, mesma origem e Docker | Proposta |
| [0013](ADR-0013-estrategia-de-testes-e-ci.md) | Estratégia de testes e CI | Proposta |
| [0014](ADR-0014-politica-de-dependencias.md) | Política de dependências e avaliação da stack | Proposta |
| [0015](ADR-0015-contratos-da-engine.md) | Contratos da Engine | **Aceita** |

## Status possíveis

| Status | Significado |
|---|---|
| **Proposta** | Recomendação da arquitetura, aguardando aprovação do autor |
| **Aceita** | Aprovada. Se veio de decisão explícita do autor, o ADR o diz |
| **Substituída** | Trocada por outra ADR (a nova referencia a antiga) |
| **Rejeitada** | Avaliada e descartada (mantida para registrar o motivo) |

## Convenções

- Nome do arquivo: `ADR-NNNN-assunto-curto.md`. A numeração é permanente e nunca é reaproveitada.
- Um ADR aceito **não é editado** para mudar a decisão: cria-se um novo ADR que o **substitui**, e o antigo passa a "Substituída". Correções de texto e esclarecimentos são permitidos.
- Cada ADR segue o modelo: **Contexto, Decisão, Alternativas consideradas, Justificativa, Consequências** (e, quando houver, **Pontos em aberto**).
- Marcações: ✅ confirmado pelo autor · 💡 proposta · ❓ em aberto. Perguntas seguem a numeração global (Q1…).
- Os ADRs não contêm código; descrevem decisões e seus efeitos.
