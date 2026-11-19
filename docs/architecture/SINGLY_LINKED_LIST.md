# Lista simplesmente encadeada (Singly Linked List)

- **Versão:** 0.2.1 (19/11/2026; corrige §4.3, que na 0.2 dizia, por engano, que a imutabilidade era só convenção). A 0.1 (17/11) entregou nó, `head`, tamanho, vazio, inserção nas pontas e `toArray`; a 0.2 acrescenta as operações avançadas e formaliza o rastreamento.
- **Pacote:** `packages/engine` · **Pasta:** `src/labs/linked-lists/singly-linked-list/`
- **Decisões:** [ADR-0016](DECISIONS/ADR-0016-lista-encadeada-modelo-e-item.md) · **Contratos:** [ENGINE.md](ENGINE.md)
- Marcações: ✅ confirmado · 💡 decisão minha, pendente de confirmação · ❓ em aberto

---

## 1. Visão geral

A estrutura existe em **duas camadas**, de propósito (ADR-0016):

| Camada | Arquivo | Papel |
|---|---|---|
| **Lista real** | `list.ts` | Classe genérica `SinglyLinkedList<T>`, nós ligados por referência, sem array por trás. Define o que cada operação *faz*. Interna ao pacote ✅ (Q82). |
| **Item da Engine** | `singly-linked-list.ts` + arquivos de apoio | A mesma lista como simulação passo a passo, no formato dos contratos (estado JSON plano, passos, contadores, âncoras). É o que o catálogo e a interface enxergam. |

Os testes sorteiam sequências de operações (válidas **e inválidas**) e exigem que as duas camadas concordem em resultado, recusa, ordem, tamanho e fim.

### 1.1 Arquivos do item

| Arquivo | Responsabilidade |
|---|---|
| `types.ts` | Operações, âncoras de pseudocódigo e catálogo de mensagens (só tipos) |
| `list-state.ts` | Leitura e transformação do estado: funções puras, sem passos (`nodesInOrder`, `withNext`, `withoutNode`…) |
| `steps.ts` | **Mecanismo de rastreamento da lista**: o percurso `walk`, as rejeições, os destaques |
| `insert.ts` | `insertHead`, `insertTail`, `insertAt` |
| `remove.ts` | `removeHead` e o núcleo de `removeAt` (usado também por `removeTail`) |
| `query.ts` | `search`, `getAt`, `traverse`, `toArray` |
| `singly-linked-list.ts` | Descritor (operações, parâmetros, complexidade, âncoras, mensagens) e despacho |

### 1.2 Como se evitou duplicar a lógica

| Onde poderia duplicar | Como é uma só vez |
|---|---|
| Andar de nó em nó (6 operações) | `walk` em `steps.ts`: conta 1 acesso por nó, monta o rastro `visited` e chama quem narra |
| `insertAt` nas pontas | Posição 0 chama `insertHeadSteps`; posição = tamanho chama `insertTailSteps` |
| `removeTail` | É `removeAt(tamanho − 1)`: o desligamento do nó existe só em `removeAtCore` |
| `removeAt` na posição 0 | Chama `removeHeadSteps` |
| `traverse` × `toArray` | Mesmo percurso (`fullPass`); mudam só mensagens, âncoras e resultado |
| Rejeição por lista vazia ou posição inexistente | `rejectEmpty` / `rejectPosition` |

---

## 2. Operações

Posições são **índices a partir de 0** (0 = primeiro nó), coerentes com o texto de ERR-005 ("aceita posições de 0 a 4"). Valores: inteiros de -999 a 999. Limite: 50 nós.

| Operação | Parâmetros | Resultado | O que faz |
|---|---|---|---|
| `insertHead` | `value` | nenhum | Insere no início |
| `insertTail` | `value` | nenhum | Insere no final (usa `tail`, sem percorrer) |
| `insertAt` | `position`, `value` | nenhum | Insere na posição (0 a tamanho) |
| `removeHead` | — | `value` removido | Remove o primeiro nó |
| `removeTail` | — | `value` removido | Remove o último nó |
| `removeAt` | `position` | `value` removido | Remove o nó da posição |
| `search` | `value` | `found {id, index}` ou `not-found` | Procura a **primeira** ocorrência |
| `getAt` | `position` | `value` lido | Consulta o valor da posição |
| `traverse` | — | nenhum | Percorre a lista (a animação do percurso) |
| `toArray` | — | `values` | Percorre e devolve os valores na ordem |

`traverse` e `toArray` fazem o mesmo percurso; `traverse` não devolve resultado (o que importa é o caminho) e `toArray` devolve o conteúdo. ✅ Q87.

### 2.1 O nó nasce solto e sai desligado

Toda inserção tem um passo em que o nó **já existe** em `nodes`, mas ninguém aponta para ele; toda remoção tem um passo em que o nó **já está desligado** (fora da ordem `head → next`) e ainda existe, e só no último passo é liberado. "Estar na lista" significa ser alcançável a partir de `head`. É o que permite à interface mostrar a religação de ponteiros.

Ordem de religação em `insertAt`: **primeiro** o novo nó aponta para o seguinte, **depois** o anterior aponta para o novo. Inverter perderia o resto da lista (teste de mutação cobre).

---

## 3. Casos especiais

Regra de classificação (ENGINE.md §8.2): *o problema está na mensagem ou no mundo?*

| Caso | Operações | Desfecho | Detalhe |
|---|---|---|---|
| **Posição negativa** | `insertAt`, `removeAt`, `getAt` | `invalid-input` | `OUT_OF_RANGE`, `path: "position"`, `meta {min: 0, max: 49}`. Não gera execução |
| Posição não inteira ou ausente | idem | `invalid-input` | `INVALID_TYPE` / `REQUIRED` |
| Posição > 49 | idem | `invalid-input` | `OUT_OF_RANGE` (a lista cabe 50 nós) |
| **Posição fora do tamanho** (ex.: 7 numa lista de 3) | `insertAt` (> tamanho), `removeAt`, `getAt` (≥ tamanho) | `rejected` · `POSITION_OUT_OF_RANGE` | ERR-005. Execução curta (2 passos), estado intacto, mensagem com `{position, size}` |
| **Lista vazia** | `removeHead`, `removeTail`, `removeAt`, `getAt` | `rejected` · `EMPTY_STRUCTURE` | ERR-004. Estado intacto |
| Lista vazia | `insertAt` | posição 0 vale; ≥ 1 é `POSITION_OUT_OF_RANGE` | |
| Lista vazia | `search`, `traverse`, `toArray` | `completed` | `search` termina em `not-found` com 0 comparações |
| **Um só elemento** | `removeHead`, `removeTail`, `removeAt(0)` | `completed` | Há um passo a mais: `tail` também vira `null` |
| Um só elemento | `insertAt` | posições 0 e 1 valem; 2 é rejeitada | |
| **Elementos repetidos** | `search` | `found` | Sempre a **primeira** ocorrência |
| Elementos repetidos | `removeAt`, `insertAt`, `getAt` | `completed` | Agem só sobre o nó da posição; os iguais ficam |
| **Valor inexistente** | `search` | `completed` · `not-found` | Não é erro: percorre tudo e conclui |
| Lista cheia (50) | `insertHead`, `insertTail`, `insertAt` | `invalid-input` · `LIMIT_EXCEEDED` | Regra de produto (ERR-003) |

**Sobre "remoção de elemento inexistente".** As sete operações pedidas não incluem *remover por valor*. Na lista de operações, "remover algo que não existe" acontece como remover de lista vazia ou de posição inexistente, tratados acima. O ERR-006 (`VALUE_NOT_FOUND`, "o valor 42 não está na lista") só ocorre numa operação de remover por valor, que **não foi implementada** por não estar no escopo. ❓ Q85.

---

## 4. Rastreamento: como cada passo representa a evolução da lista

O contrato aprovado (ADR-0015) já define o `Step` e o `StepRecorder`. **Não foi alterado**: o PROMPT 11 pede que cada passo permita representar a evolução sem modificar estados anteriores, e o contrato já oferece cada item pedido.

| Pedido | Onde está no passo | Como a lista usa |
|---|---|---|
| Estado da estrutura naquele passo | `step.state` (retrato **completo**, `LinkedListState`) | Toda alteração gera um estado **novo** (`withNext`, `withoutNode`, `{...state}`); nenhum já registrado é tocado |
| Descrição da ação | `step.message` = `{key, params}` | 47 chaves tipadas em `types.ts`; o texto em português fica na interface (ADR-0004) |
| Nó atual | `step.highlights` com papel `current` | Um único `current` por passo de visita, na posição anunciada em `params.index` |
| Nós destacados | `step.highlights` (papéis `visited`, `previous`, `head`, `tail`, `inserted`, `removed`, `found`, `not-found`; alvos `element` e `edge`) | Rastro `visited` dos nós já percorridos; aresta `inserted` para a ligação recém-criada |
| Operação executada | `execution.operationName` e `execution.operation` | Nome e parâmetros exatos; também é o que se guarda na receita |
| Linha de pseudocódigo | `step.anchor` (âncora simbólica, `sll.<operação>.<linha>`) | Todo passo desta estrutura tem âncora (testado); a tabela da seção 5 liga cada âncora a uma linha |
| Contadores | `step.counters` (acumulados) | `comparisons`, `moves` e `accesses`, só o registrador altera |

### 4.1 O que a lista acrescentou (`steps.ts`)

- **`walk`**: o percurso, escrito uma vez. Visita as posições 0 a `last`, conta 1 acesso por nó, mantém o rastro `visited` e chama a operação para narrar. Pode parar antes (`search` ao achar).
- **`rejectEmpty` / `rejectPosition`**: as duas rejeições, com o passo que as explica.
- **`element` / `edge` / `visitedHighlights`**: construtores de destaque.

### 4.2 Contadores (💡 provisórios até a Q17; aceitos como provisórios ✅ Q84)

| Contador | Significado |
|---|---|
| `comparisons` | Comparação de valores (só `search`: 1 por nó visitado) |
| `moves` | **Gravação de ponteiro** (`next`, `head` ou `tail`). Liberar o nó não conta |
| `accesses` | **Leitura de um nó** existente (cada visita do percurso, o antigo `tail`, o nó alvo) |

### 4.3 Como a imutabilidade é garantida

**Por construção**, em duas camadas do `core/` (valem para toda estrutura, não só para a lista):

1. **O registrador congela cada passo no instante em que o registra** (`deepFreeze`: estado, nós, destaques, parâmetros da mensagem e contadores). Código que tente alterar um passo já registrado, mesmo durante a execução, lança `TypeError` na hora.
2. **A `Execution` inteira é congelada ao ser entregue** (inclusive o array de passos, o resultado e os metadados), de modo que nem o consumidor consegue alterá-la.

**Efeito colateral intencional:** o estado de entrada do chamador também fica congelado depois de `run`, porque o passo 0 o referencia. Quem precisar de uma versão alterável deve copiá-lo.

Os testes conferem isso em `core/freeze.test.ts` (todas as estruturas do catálogo, conclusões e rejeições) e, na lista, conferem a **evolução** de cada passo (ex.: em `insertAt`, o passo "nó solto" continua mostrando o nó sem apontar para ninguém depois de a operação terminar).

> Correção (19/11/2026): a v0.2 deste documento afirmava que o congelamento não existia e perguntava (Q86) se devia ser criado. Estava errado: o registrador já congelava cada passo desde o PROMPT 09. Faltavam apenas o array de passos e a `Execution`, congelados agora.

---

## 5. Pseudocódigo e âncoras

Texto do pseudocódigo é conteúdo da interface; aqui estão as linhas e a âncora de cada uma. `n` = tamanho.

**`insertAt(pos, valor)`**

| Linha | Âncora |
|---|---|
| (abertura) | `sll.insertAt.entry` |
| se `pos == 0`, insere no início; se `pos == n`, insere no final | `sll.insertAt.check-position` (depois seguem as âncoras de `insertHead` / `insertTail`) |
| `anterior ← head`; repete `pos − 1` vezes: `anterior ← anterior.next` | `sll.insertAt.walk` |
| `novo ← Nó(valor)` | `sll.insertAt.allocate` |
| `novo.next ← anterior.next` | `sll.insertAt.link-next` |
| `anterior.next ← novo` | `sll.insertAt.link-previous` |
| `tamanho ← tamanho + 1` | `sll.insertAt.done` |

**`removeHead()`**

| Linha | Âncora |
|---|---|
| se `head == null`, rejeita | `sll.removeHead.check-empty` |
| `removido ← head` | `sll.removeHead.read` |
| `head ← head.next` | `sll.removeHead.set-head` |
| se `head == null`, `tail ← null` | `sll.removeHead.set-tail` |
| libera `removido`; `tamanho ← tamanho − 1` | `sll.removeHead.done` |

**`removeTail()`**: se vazia, rejeita (`sll.removeTail.check-empty`); senão `removeAt(n − 1)` (`sll.removeTail.delegate`, depois as âncoras de `removeAt`).

**`removeAt(pos)`**

| Linha | Âncora |
|---|---|
| se vazia ou `pos ≥ n`, rejeita; se `pos == 0`, remove o início | `sll.removeAt.check-position` |
| `anterior ← head`; repete `pos − 1` vezes: `anterior ← anterior.next` | `sll.removeAt.walk` |
| `alvo ← anterior.next` | `sll.removeAt.read-target` |
| `anterior.next ← alvo.next` | `sll.removeAt.unlink` |
| se `alvo == tail`, `tail ← anterior` | `sll.removeAt.set-tail` |
| libera `alvo`; `tamanho ← tamanho − 1` | `sll.removeAt.done` |

**`search(valor)`**: `atual ← head`; enquanto `atual ≠ null`: compara (`sll.search.compare`); se igual, devolve a posição (`sll.search.found`); senão `atual ← atual.next`; ao fim, devolve ausente (`sll.search.not-found`). Abertura: `sll.search.entry`.

**`getAt(pos)`**: se vazia ou `pos ≥ n`, rejeita (`sll.getAt.check-position`); anda `pos` vezes (`sll.getAt.walk`); devolve `atual.valor` (`sll.getAt.done`).

**`traverse()` / `toArray()`**: `atual ← head`; enquanto `atual ≠ null`: visita (`.visit`), `atual ← atual.next`. Abertura e fechamento: `.entry` e `.done`.

As âncoras de `insertHead`, `insertTail` e `toArray` já estavam na v0.1 e não mudaram.

---

## 6. Complexidade

`n` = número de nós. Valores declarados no descritor; **teóricos**: descrevem como o número de **passos elementares** cresce com `n`, não quanto tempo leva. A Engine não mede tempo (determinismo, ADR-0003), e os testes não têm *benchmark*. O que confirma a teoria são os contadores (ex.: `getAt` na última posição de 4 e de 20 nós faz 4 e 20 acessos).

| Operação | Melhor | Médio | Pior | Espaço extra | Quando acontece cada caso |
|---|---|---|---|---|---|
| `insertHead` | O(1) | O(1) | O(1) | O(1) | Sempre 2 a 3 gravações |
| `insertTail` | O(1) | O(1) | O(1) | O(1) | Graças a `tail` ✅ (Q83) |
| `removeHead` | O(1) | O(1) | O(1) | O(1) | Sempre 1 a 2 gravações |
| `insertAt` | O(1) | O(n) | O(n) | O(1) | Melhor: posição 0 ou `n`. Pior: posição `n − 1` |
| `removeAt` | O(1) | O(n) | O(n) | O(1) | Melhor: posição 0. Pior: última |
| `removeTail` | O(1) | O(n) | O(n) | O(1) | Melhor: um só nó. Singular: precisa do **penúltimo**, sem volta |
| `search` | O(1) | O(n) | O(n) | O(1) | Melhor: 1º nó. Pior: último ou ausente |
| `getAt` | O(1) | O(n) | O(n) | O(1) | Melhor: posição 0 |
| `traverse` | O(n) | O(n) | O(n) | O(1) | Sempre todos os nós |
| `toArray` | O(n) | O(n) | O(n) | **O(n)** | Todos os nós; o array de saída tem `n` posições |
| Espaço da estrutura | — | — | — | O(n) | Um nó por elemento (valor + 1 referência) |

Médio O(n) assume posição ou valor uniformemente distribuído (em média, metade da lista). Não há custo amortizado.

⚠ **Custo do simulador ≠ custo do algoritmo.** A simulação grava um retrato completo do estado a cada passo e calcula `size` percorrendo a lista, então, por exemplo, `insertHead` custa O(n) de tempo e memória *no simulador* embora o algoritmo seja O(1). Com no máximo 50 nós é irrelevante, e é o preço de ter passos imutáveis (ADR-0003).

---

## 7. Exemplos de uso

Saídas **reais**, geradas pelo código. A Engine é consumida só pela API pública do pacote (`getItem`).

```ts
import { getItem } from '@dss/engine';

const item = getItem('singly-linked-list')!;
const created = item.createInitialState([4, 8, 15]);   // lista 4 → 8 → 15
if (!created.ok) throw new Error('valores inválidos');

const attempt = item.run(created.state, { type: 'insertAt', position: 2, value: 9 });
// attempt.outcome: 'completed' | 'rejected' | 'invalid-input' | 'precondition-failed'
```

**`insertAt` posição 2, valor 9, em `[4, 8, 15]`**: resultado `[4, 8, 9, 15]`; 2 acessos e 2 gravações.

| # | Âncora | Mensagem | Destaques |
|---|---|---|---|
| 0 | `insertAt.entry` | `insertAt.start {position:2, value:9}` | `head:0 tail:2` |
| 1 | `insertAt.walk` | `insertAt.visit {value:4, index:0}` | `current:0` |
| 2 | `insertAt.walk` | `insertAt.visit {value:8, index:1}` | `visited:0 current:1` |
| 3 | `insertAt.allocate` | `insertAt.allocated {value:9}` | `previous:1 inserted:3` (nó **solto**) |
| 4 | `insertAt.link-next` | `insertAt.linked-next {value:9, nextValue:15}` | `previous:1 inserted:3 aresta 3→2` |
| 5 | `insertAt.link-previous` | `insertAt.linked-previous {previousValue:8, value:9}` | `previous:1 inserted:3 aresta 1→3` |
| 6 | `insertAt.done` | `insertAt.done {value:9, position:2, size:4}` | `inserted:3` |

**`search` 99 em `[4, 8, 15]`** (ausente, não é erro): `completed`, resultado `not-found`, 3 comparações e 3 acessos; passos 1 a 3 comparam `4`, `8`, `15` e o passo 4 destaca todos como `not-found`.

**`removeAt` posição 7 em `[4, 8, 15]`**: `rejected` (`POSITION_OUT_OF_RANGE`), estado intacto, 2 passos; o 2º traz `sll.position.out-of-range {position:7, size:3}`. A interface monta "Posição 7 inexistente. Esta lista aceita posições de 0 a 2."

**`removeAt` posição −1**: `invalid-input`, sem execução:
`{"code":"OUT_OF_RANGE","path":"position","meta":{"min":0,"max":49}}`

Encadear operações é passar o `finalState` de uma como estado da próxima (teste "exemplo de uso" em `tracing.test.ts`).

A lista real (uso direto, só em teste):

```ts
const list = new SinglyLinkedList<number>().append(4).append(8).append(15);
list.insertAt(2, 9);      // 4 8 9 15
list.indexOf(15);         // 3
list.removeAt(3);         // devolve 15 → 4 8 9
list.get(7);              // lança RangeError: "Posição 7 inexistente: aceita de 0 a 2"
```

---

## 8. Testes

| Arquivo | Testes | Cobre |
|---|---|---|
| `list.test.ts` | 25 | (v0.1) Lista real: vazia, inserções nas pontas, ordem, tamanho, repetidos, tipos, cópia, encapsulamento |
| `list-operations.test.ts` | 37 | Lista real: `insertAt`, `removeFirst`, `removeLast`, `removeAt`, `get`, `indexOf`, iterador; vazia, 1 elemento, repetidos, posições inválidas, `tail` correto depois de cada remoção |
| `singly-linked-list.test.ts` | 34 | (v0.1) Item: estado inicial, `insertHead`, `insertTail`, `toArray`, limites, imutabilidade, defesa contra estado corrompido |
| `operations.test.ts` | 64 | Item: cada operação nova e cada caso especial da seção 3; contadores; complexidade declarada; **conformidade com a lista real em 40 rodadas × 40 operações aleatórias** (válidas e inválidas; exige > 100 recusas e > 500 sucessos para valer) |
| `tracing.test.ts` | 18 | Rastreamento: os 6 itens em todo passo, nó atual, destaques, evolução sem alterar passos anteriores, ida e volta por JSON, **âncoras e mensagens declaradas = usadas**, invariantes I-01 a I-15 em 172 execuções, exemplo de uso |
| `catalog/registry.test.ts` | — | Invariantes genéricas sobre todo o catálogo (agora com as 10 operações) |

**Os testes detectam defeitos.** Em verificação à parte foram introduzidos 9 erros de propósito (novo nó sem apontar para o seguinte, `tail` que não recua na remoção, `tail` que não é limpo com um só nó, `search` que não para na primeira ocorrência, limite fora por um em `getAt`, percurso que não conta acesso, e três na lista real) e **todos** foram pegos; os arquivos foram restaurados e conferidos.

Compatibilidade: **nenhum teste anterior foi alterado ou removido** (os 166 da v0.1 passam como estavam; só se somaram novos).

---

## 9. Limitações

1. **Sem remover por valor** (ERR-006 não ocorre): não estava entre as sete operações. ✅ Q85 aprovada, fica para o prompt que a pedir.
2. **Sem inserção/remoção antes ou depois de um valor, sem inverter, sem ordenar** (fora do escopo).
3. **O item só aceita números** (-999 a 999). A classe `SinglyLinkedList<T>` é genérica, mas só os testes a usam.
4. O estado de entrada do chamador fica congelado depois de `run` (§4.3). É intencional, mas é uma regra a conhecer.
5. **Contadores provisórios** até a Q17.
6. **Sem textos em português** para as 47 chaves de mensagem e sem texto de pseudocódigo: a interface ainda não existe.
7. A regra de lint "um item não importa outro item" continua sem automação (esta lista importa só de `core/`).
8. `Step` e `Execution` **não foram congelados**: falta o terceiro tipo visual (ADR-0015 §10). A lista exerceu bastante o contrato (rejeições, resultado `found`, arestas, nó solto) sem exigir mudança, o que é evidência a favor.

## 10. Perguntas

| # | Pergunta | Recomendação | Estado |
|---|---|---|---|
| Q82 | Exportar `SinglyLinkedList<T>` na API pública? | Manter interna | ✅ interna |
| Q83 | Guardar `tail`? | Sim | ✅ guardar |
| Q84 | Contadores provisórios da lista | Aceitar até a Q17 | ✅ aceito |
| ✅ **Q85** | Criar *remover por valor* (`removeValue`)? É a operação em que o ERR-006 (`VALUE_NOT_FOUND`) realmente acontece | Sim, num próximo prompt | **Aprovada** (19/11); a implementar quando um prompt a pedir |
| ✅ **Q86** | Congelar cada retrato para impedir por construção que um passo registrado seja alterado? | Sim | **Aprovada** (19/11). A premissa estava errada: o registrador já congelava os passos. Fechada a lacuna que faltava (array de passos e `Execution`), com `core/freeze.test.ts` |
| ✅ **Q87** | `traverse` deve devolver `values` como `toArray`, ou continuar sem resultado? | Continuar sem resultado | **Decidido** (19/11): continua sem resultado |
