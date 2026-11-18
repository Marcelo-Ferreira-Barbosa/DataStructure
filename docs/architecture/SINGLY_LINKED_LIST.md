# Lista simplesmente encadeada (Singly Linked List)

- **Versão:** 0.1 (17/11/2026)
- **Pacote:** `packages/engine` · **Pasta:** `src/labs/linked-lists/singly-linked-list/`
- **Decisões:** [ADR-0016](DECISIONS/ADR-0016-lista-encadeada-modelo-e-item.md) · **Contratos:** [ENGINE.md](ENGINE.md)
- Marcações: ✅ confirmado · 💡 decisão minha, pendente de confirmação · ❓ em aberto

---

## 1. O que foi entregue

| # | Funcionalidade pedida | Onde está |
|---|---|---|
| 1 | Definição do `Node` | `list.ts` (`Node<T>`, interna) · `ListNode` em `core/state.ts` |
| 2 | Referência para o próximo nó | `Node.next` · `ListNode.next` (por id) |
| 3 | Referência inicial da lista | `SinglyLinkedList.head` · `LinkedListState.head` |
| 4 | Controle do tamanho | `SinglyLinkedList.size` (contador mantido) |
| 5 | Verificação de lista vazia | `SinglyLinkedList.isEmpty()` |
| 6 | Inserção no início | `prepend` · operação `insertHead` |
| 7 | Inserção no final | `append` · operação `insertTail` |
| 8 | Conversão para array | `toArray()` · operação `toArray` |

A estrutura existe em **duas camadas**, de propósito (ADR-0016):

| Camada | Arquivo | Papel |
|---|---|---|
| **Lista real** | `list.ts` | Classe genérica `SinglyLinkedList<T>`, feita de nós ligados por referência. Define o que a lista *faz*. |
| **Item da Engine** | `singly-linked-list.ts` | A mesma lista como simulação passo a passo, no formato dos contratos do `ENGINE.md` (estado JSON plano, passos, contadores, âncoras). É o que o catálogo e a interface enxergam. |

💡 A razão da duplicação é o contrato: o estado da Engine precisa ser JSON plano, com nós ligados **por id** e sem referências de objeto (ENGINE.md §5), então a classe com ponteiros reais não pode ser o estado. A lista real serve de **modelo de referência**: os testes sorteiam sequências de inserções e exigem que a simulação e a lista real cheguem à mesma ordem e ao mesmo tamanho.

---

## 2. A lista real (`list.ts`)

```ts
class Node<T> {            // interna: ninguém de fora cria nem religa nós
  next: Node<T> | null = null;
  constructor(readonly value: T) {}
}

class SinglyLinkedList<T> {
  #head: Node<T> | null;   // referência inicial
  #tail: Node<T> | null;   // referência ao último nó
  #size: number;           // contador

  get size(): number;
  get head(): NodeView<T> | null;   // visão somente leitura
  get tail(): NodeView<T> | null;
  isEmpty(): boolean;
  prepend(value: T): this;
  append(value: T): this;
  toArray(): T[];
}
```

- **Sem vetor por trás.** A ordem existe só em `head → next → next → … → null`. O único array do arquivo é o **resultado** de `toArray()`.
- **Genérica em `T`.** Qualquer tipo é aceito (números, textos, objetos, `null`, `undefined`); o compilador impede misturar tipos. O limite "inteiros de -999 a 999" é regra do **item** da Engine (que é numérico), não da lista.
- **Encapsulamento.** Campos privados reais (`#`), e `head`/`tail` devolvem `NodeView<T>` (somente leitura): quem está de fora não consegue religar nós e quebrar a lista.
- **Vazia** é `head === null` (e não "valor falso"): `0`, `""`, `false`, `null` e `undefined` são valores legítimos.

### Inserção no início (`prepend`)

```
antes:   head → [2] → [3] → null          tail = [3]
1) cria [1] solto
2) [1].next = head                         ([1] → [2])
3) head = [1]
4) se a lista estava vazia, tail = [1]
depois:  head → [1] → [2] → [3] → null    tail = [3]
```

### Inserção no final (`append`)

```
antes:   head → [1] → [2] → null          tail = [2]
1) cria [3] solto
2) se vazia: head = [3]; senão: tail.next = [3]
3) tail = [3]
depois:  head → [1] → [2] → [3] → null    tail = [3]
```

### Conversão (`toArray`)

Percorre de `head` até `null`, copiando cada valor para um array novo. O array devolvido é **cópia**: alterá-lo não altera a lista.

---

## 3. O item da Engine (`singly-linked-list.ts`)

- **Identificação:** `id = 'singly-linked-list'`, laboratório `linked-lists`, família de estado `linked-list`, `variant: 'singly'`.
- **Operações:** `insertHead(value)`, `insertTail(value)`, `toArray()`. Valores de `-999` a `999`; no máximo `50` nós.
- **Estado** (ENGINE.md §5): `nodes` guarda **todos** os nós alocados; `head` e `tail` são ids; `next` é id; `prev` é sempre `null`.
- **O nó nasce solto.** Em toda inserção há um passo em que o nó já existe em `nodes`, mas **ninguém aponta para ele**; só depois os ponteiros são ligados. A interface pode mostrar isso. "Estar na lista" significa ser alcançável a partir de `head`.
- **Entrada inválida** (valor fora da faixa, tipo errado, operação desconhecida, lista cheia) nunca lança: devolve `invalid-input` e **não gera execução**.

### Passos por operação

| Operação | Passos (âncoras) |
|---|---|
| `insertHead` | `entry` → `allocate` → `link-next` → `set-head` → (`set-tail`, só se estava vazia) → `done` |
| `insertTail` | `entry` → `check-empty` → `allocate` → (`set-head` se vazia, senão `link-tail`) → `set-tail` → `done` |
| `toArray` | `entry` → um `visit` por nó (atual em `current`, anteriores em `visited`) → `done` |

### Contadores (💡 provisórios até a Q17)

| Contador | Significado nesta lista |
|---|---|
| `comparisons` | Sempre 0 (nenhuma operação compara valores) |
| `moves` | Cada **gravação de ponteiro** (`next`, `head` ou `tail`) |
| `accesses` | Leitura de um nó existente (`insertTail`: o antigo último; `toArray`: cada nó visitado) |

Resultado: `insertHead` = 2 gravações (3 se vazia); `insertTail` = 1 acesso + 2 gravações (2 se vazia); `toArray` = 1 acesso por nó.

---

## 4. Complexidade

`n` = número de nós. Valores declarados no descritor do item (e verificados em teste pelo número de passos).

| Operação | Tempo (melhor / médio / pior) | Espaço extra | Observação |
|---|---|---|---|
| `isEmpty()` | O(1) / O(1) / O(1) | O(1) | Compara `head` com `null` |
| `size` | O(1) / O(1) / O(1) | O(1) | Contador mantido a cada inserção |
| `prepend` / `insertHead` | O(1) / O(1) / O(1) | O(1) | Cria 1 nó; não percorre |
| `append` / `insertTail` | O(1) / O(1) / O(1) | O(1) | **Só porque a lista guarda `tail`** (ver abaixo) |
| `toArray` / `toArray` | O(n) / O(n) / O(n) | O(n) | Visita todos os nós; o array de saída tem `n` posições |
| Espaço da estrutura | — | O(n) | Um nó por elemento: valor + 1 referência |

💡 **Por que guardar `tail`.** O enunciado pede "referência inicial" (`head`). Sem `tail`, `append` teria de percorrer a lista inteira até o último nó: **O(n)**. Guardar `tail` custa uma referência a mais e a obrigação de mantê-la correta (é o erro mais comum: esquecer de atualizá-la quando a lista estava vazia, caso coberto por teste), e torna `append` **O(1)**. Decisão confirmada pelo autor (Q83).

⚠ **Custo do simulador ≠ custo do algoritmo.** A complexidade acima é a do *algoritmo modelado*, e é o que a interface mostra. A *simulação* grava um retrato completo do estado a cada passo e calcula `size` percorrendo a lista, então executar `insertHead` custa O(n) de tempo e memória no simulador. Com o limite de 50 nós isso é irrelevante, e é o preço de ter passos imutáveis (ADR-0003).

---

## 5. Testes

| Arquivo | Testes | Cobre |
|---|---|---|
| `list.test.ts` | 25 | Lista real: vazia, 1 elemento, vários, início, fim, ordem, tamanho, repetidos, tipos permitidos (números, textos, objetos, valores "falsos"), cópia em `toArray`, encapsulamento |
| `singly-linked-list.test.ts` | 34 | Item: estado inicial, passos e âncoras, nó solto, contadores, custo constante, limites, entradas inválidas, imutabilidade, JSON, conformidade com a lista real (20 rodadas aleatórias semeadas), defesa contra estado corrompido |
| `catalog/registry.test.ts` | — | A suíte genérica de invariantes (I-01 a I-15) também roda sobre este item |

**Os testes detectam defeitos:** em verificação à parte, quatro erros foram introduzidos de propósito (não atualizar `tail` em lista vazia, não contar o tamanho, não ligar o antigo último nó, não ligar o novo nó ao antigo início) e **todos** foram pegos; os arquivos foram restaurados em seguida.

Validação de tipo: `@ts-expect-error` confirma que a lista de números **rejeita** textos e que `next`, `value`, `size` e `head` são somente leitura para quem está de fora.

---

## 6. Limitações

1. **Só inserção e conversão.** Não há remoção, busca, inserção em posição, inversão etc. (fora do escopo desta entrega).
2. **O item só aceita números** (-999 a 999), como as demais estruturas da Engine. A classe `SinglyLinkedList<T>` é genérica, mas hoje só os testes a usam; **não** faz parte da API pública do pacote (`index.ts`). ✅ Q82 (decidido).
3. **Contadores provisórios** até a Q17. ✅ Q84 (aceito).
4. `ENGINE.md` §14.4: a regra "um item não importa outro item" continua sem lint; agora existem dois itens (esta lista importa só de `core/`).
5. Não há textos em português para as chaves `sll.*`: a interface ainda não existe (catálogo de textos no Web, pendente).

## 7. Perguntas (Q82 a Q84 respondidas pelo autor em 17/11/2026; seguem a numeração global)

| # | Pergunta | Minha recomendação |
|---|---|---|
| ✅ **Q82** | Exportar `SinglyLinkedList<T>` na API pública do pacote, ou mantê-la como modelo interno de teste? | Manter interna; exportar só se alguma parte do produto precisar. **Decisão: manter interna** |
| ✅ **Q83** | A lista guarda `tail` (inserção no final O(1)) ou só `head` (O(n), mais fiel ao enunciado literal)? | Guardar `tail`: é o que torna `insertTail` didaticamente comparável a `insertHead`. Pode virar um exercício futuro "e se não houvesse `tail`?". **Decisão: guardar `tail`** |
| ✅ **Q84** | Contadores da lista: `moves` = gravação de ponteiro e `accesses` = leitura de nó. Aceitar até a Q17? | Sim, provisório. **Decisão: aceito** |
