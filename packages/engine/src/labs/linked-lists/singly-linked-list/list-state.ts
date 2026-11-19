import type { ElementId } from '../../../core/ids';
import { EngineInvariantError } from '../../../core/problems';
import type { LinkedListState, ListNode } from '../../../core/state';
import type { Highlight } from '../../../core/step';

/**
 * Leitura e transformação do estado da lista: funções puras, sem registrar passos.
 * Toda transformação devolve um estado NOVO; nenhum estado já registrado é alterado.
 */

export function nodeById(state: LinkedListState, id: ElementId): ListNode {
  const node = state.nodes.find((n) => n.id === id);
  if (node === undefined) throw new EngineInvariantError(`Nó ${id} não existe no estado`);
  return node;
}

/**
 * Nós na ordem da lista: segue `next` a partir de `head`. É o que define "estar na lista":
 * um nó alocado, mas ainda não ligado (ou já desligado), não aparece aqui.
 */
export function nodesInOrder(state: LinkedListState): ListNode[] {
  const ordered: ListNode[] = [];
  let currentId = state.head;
  while (currentId !== null) {
    if (ordered.length >= state.nodes.length) {
      throw new EngineInvariantError('Ciclo detectado em lista simplesmente encadeada');
    }
    const node = nodeById(state, currentId);
    ordered.push(node);
    currentId = node.next;
  }
  return ordered;
}

/** O nó na posição `index` de uma lista já ordenada; posição inexistente é erro de programação. */
export function nodeAt(ordered: readonly ListNode[], index: number): ListNode {
  const node = ordered[index];
  if (node === undefined) throw new EngineInvariantError(`Não há nó na posição ${index}`);
  return node;
}

/** Tamanho da lista = nós alcançáveis a partir de `head`. */
export function sizeOf(state: LinkedListState): number {
  return nodesInOrder(state).length;
}

export function isEmpty(state: LinkedListState): boolean {
  return state.head === null;
}

/** Novo estado com o campo `next` do nó `id` trocado. */
export function withNext(
  state: LinkedListState,
  id: ElementId,
  next: ElementId | null,
): LinkedListState {
  return { ...state, nodes: state.nodes.map((n) => (n.id === id ? { ...n, next } : n)) };
}

/** Novo estado sem o nó `id` (libera o nó já desligado). */
export function withoutNode(state: LinkedListState, id: ElementId): LinkedListState {
  return { ...state, nodes: state.nodes.filter((n) => n.id !== id) };
}

/** Ponteiros `head` e `tail` como destaques (só os que apontam para algum nó). */
export function pointerHighlights(state: LinkedListState): Highlight[] {
  const out: Highlight[] = [];
  if (state.head !== null) out.push({ target: { type: 'element', id: state.head }, role: 'head' });
  if (state.tail !== null) out.push({ target: { type: 'element', id: state.tail }, role: 'tail' });
  return out;
}
