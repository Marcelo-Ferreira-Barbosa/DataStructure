# ADR-0016 — Lista encadeada: modelo de referência e item da Engine

- **Status:** **Aceita** (autor confirmou Q82 a Q84 em 17/11/2026: classe interna, guardar `tail`, contadores provisórios)
- **Data:** 17/11/2026
- **Requisitos relacionados:** RF-012, RF-013, RF-020, RNF-023, RNF-028
- **Documento de referência:** [`../SINGLY_LINKED_LIST.md`](../SINGLY_LINKED_LIST.md)
- **Complementa:** ADR-0015 (contratos da Engine)

## Contexto

O PROMPT 10 pede uma lista simplesmente encadeada com `Node`, referência para o próximo, referência inicial, tamanho, verificação de vazio, inserção no início e no final e conversão para array, **sem usar array como implementação interna** e de forma genérica. Os contratos aprovados (ADR-0015) exigem, porém, que o estado de uma estrutura seja **JSON plano com referências por id** (sem referências de objeto), para ser serializável, comparável e animável passo a passo.

As duas exigências não cabem no mesmo objeto: uma lista com ponteiros reais não é JSON plano, e um estado em JSON plano não é uma lista de nós ligados por referência.

## Decisão

1. **Duas camadas na mesma pasta** (`labs/linked-lists/singly-linked-list/`):
   - `list.ts`: classe genérica `SinglyLinkedList<T>`, com nós ligados por referência e campos privados. É o **modelo de referência**: define o comportamento correto.
   - `singly-linked-list.ts`: **item da Engine** (estado plano, passos, contadores, âncoras), registrado no catálogo.
2. **Conformidade por teste:** sequências aleatórias semeadas de inserções são aplicadas às duas camadas, que devem concordar em ordem, tamanho e vazio a cada passo.
3. **A lista guarda `head`, `tail` e o tamanho.** `tail` torna a inserção no final O(1).
4. **O nó nasce solto:** em toda inserção existe um passo com o nó alocado e ainda não ligado.
5. A classe **não** é exportada pelo `index.ts` do pacote.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Só a classe, sem item | Não apareceria no catálogo nem teria passos; a interface não a enxergaria |
| Só o item, sem classe | Não atenderia ao enunciado (classe genérica com `Node`) nem daria um modelo independente para conferir a simulação |
| Item implementado *sobre* a classe (a classe como estado) | Estado com referências de objeto: não serializável e quebra ADR-0015 §2 |
| Só `head` | `insertTail` O(n); torna a comparação com `insertHead` menos didática |

## Justificativa

O modelo de referência dá um segundo caminho, independente e simples, para o mesmo comportamento; a simulação passo a passo, mais complexa, é verificada contra ele. É o mesmo princípio de "provar que o teste detecta o defeito" do ADR-0015.

## Consequências

- Há duas implementações do mesmo comportamento para manter. Em troca, uma diverge da outra e o teste de conformidade acusa.
- A classe, por ora, só é usada em testes (código de produção "sem uso"). Se virar incômodo, a Q82 decide exportá-la ou movê-la para `testing/`.
- Estruturas futuras com a mesma tensão (árvores, grafos) podem repetir o padrão, mas **não é obrigatório**: o ADR vale para esta estrutura.

## Pontos em aberto

- ✅ Q82, Q83 e Q84 respondidas. Resta a Q17 (definição final dos contadores), que torna provisórios os da lista.
