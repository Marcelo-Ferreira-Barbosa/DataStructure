# ADR-0015 — Contratos da Engine

- **Status:** **Aceita** (contratos aprovados pelo autor em 17/11/2026 com "pode começar"; Q74 a Q76 adotadas pela recomendação)
- **Data:** 17/11/2026
- **Requisitos relacionados:** RF-012, RF-013, RF-016 a RF-018, RF-020, RF-024, RF-029 a RF-031, RN-002, RN-010, RN-012, RNF-020, RNF-023, RNF-028, RNF-029
- **Documento de referência:** [`../ENGINE.md`](../ENGINE.md) (contratos TypeScript, exemplos e testes)
- **Complementa:** ADR-0002, ADR-0003, ADR-0004, ADR-0006

## Contexto

As ADR-0002, 0003 e 0004 definiram *o que* a Engine é (pura, por *snapshots*, com chaves e âncoras), mas não o **contrato exato** que cada estrutura precisa seguir. Sem ele, cada estrutura (pilha, lista, árvore, heap, hash, grafo, ordenação) tenderia a inventar o seu formato de passo, de erro e de contagem, e a interface teria de tratar cada caso.

## Decisão

1. **Uma execução é um valor:** `Execution` contém nome da operação, estado inicial e final, passos, resultado, complexidade teórica e metadados. Nenhum tempo, nenhuma duração (determinismo).
2. **Estados são dados planos, por família (`kind`)**, com elementos de identidade estável (`ElementId`, numérico com marca) e **referências por id, nunca por objeto** (sem ciclos). Ids vêm de `state.nextId`.
3. **Quatro desfechos**: `invalid-input` e `precondition-failed` (sem execução) e `rejected` e `completed` (com execução). Entrada de usuário **nunca lança**; só `EngineInvariantError` (erro de programação) lança. Códigos de problema alinhados aos da API, mais `LIMIT_EXCEEDED`.
4. **Passos por um registrador único** (`step`, `compare`, `move`, `access`): o algoritmo narra, o registrador numera, congela e conta. **Um passo por evento observável.**
5. **Descritor declarativo por item** (operações, parâmetros e faixas, complexidade, âncoras, chaves de mensagem, exemplos): alimenta validação, formulário e testes.
6. **Tipagem:** `ItemTypes` agrupa estado, operação, mensagens e âncoras; mensagens tipadas por catálogo; `JsonSafe` impede estado não serializável; fachada `Item` sem genéricos, com o apagamento de tipos concentrado em `core/define-item.ts`.
7. **Complexidade** como dado: conjunto fechado de notações, por operação, com melhor, médio e pior caso, espaço e custo amortizado.
8. **Testes:** suíte genérica de invariantes (I-01 a I-15) sobre todo o catálogo, **mais testes que provam que cada invariante detecta a sua violação**; *fixtures* dourados; PRNG semeado para propriedades.
9. **Organização:** `core/`, `catalog/`, `labs/<laboratório>/<item>/` e `testing/` (apoio de testes, nunca importado por produção). `core/` não importa `labs/` nem `catalog/` (imposto por lint).
10. **Congelamento:** o contrato de `Step` e `Execution` só é congelado após **três itens de tipos visuais distintos** estarem implementados; depois, mudar exige novo ADR.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| **Cada estrutura define seu próprio formato de passo** | A interface teria um visualizador de passos por estrutura; contraria RNF-023 |
| **Classes com métodos (`stack.push()`) como estado** | Não serializam; viabilizam ciclos; misturam dado e comportamento |
| **Exceções para entrada inválida e operação impossível** | Obriga o chamador a capturar e a distinguir erro de usuário de defeito; operações rejeitadas são **conteúdo didático**, não erro |
| **Algoritmos mantendo os próprios contadores** | A definição de comparação/troca/acesso divergiria entre itens |
| **Texto dentro da Engine** | Contraria a ADR-0004 (idioma, edição de conteúdo sem tocar no algoritmo) |
| **`string` como `ElementId`** | JSON mais verboso a cada passo, sem ganho |
| **Gerar passos sob demanda (*generators*)** | Contraria a ADR-0003 (retroceder e saltar de forma trivial) |

## Justificativa

Um contrato único permite escrever **uma** interface de reprodução, **uma** suíte de invariantes e **uma** estratégia de persistência para todas as estruturas. Os desfechos tipados e os códigos alinhados à API evitam tradução entre camadas. A prova de que o contrato é suficiente começou pela Pilha (implementada) e será confrontada por famílias mais difíceis (árvore ou grafo) **antes** de ser congelado.

## Consequências

**Positivas**
- Acrescentar um item não exige alterar o núcleo, os controles de reprodução nem o histórico.
- Mesma entrada produz o mesmo JSON; *fixtures* dourados e reabertura de simulações são viáveis.
- Erros de contrato (mensagem sem parâmetro, estado não serializável) são **erros de compilação**.

**Negativas / custos**
- Cada passo carrega um *snapshot* completo (≈ 1,4 KB para 50 elementos, medido na Pilha); aceitável pelos limites (ADR-0003), mas a medição com ordenação real ainda é pendente.
- Quatro `as` concentrados em `define-item.ts` (apagamento de tipos): exigem disciplina de revisão.
- O contrato pode se mostrar insuficiente para árvores balanceadas ou grafos; por isso o congelamento é adiado.

**Pontos em aberto**
- ❓ Q17 — definições de comparação, troca e acesso (provisórias para a Pilha em `ENGINE.md` §19.2).
- ❓ Q77 a Q81 — detalhes de mensagens, duplicação de estados, notação de complexidade, opções do compilador e áreas auxiliares.
