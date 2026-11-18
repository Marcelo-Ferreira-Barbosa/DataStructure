import { defineItem } from '../../../core/define-item';
import type { Complexity } from '../../../core/complexity';
import { elementId, type ElementId } from '../../../core/ids';
import type { ItemDefinition } from '../../../core/item';
import { LIMITS } from '../../../core/limits';
import { EngineInvariantError } from '../../../core/problems';
import type { LinkedListState, ListNode } from '../../../core/state';
import type { Highlight } from '../../../core/step';

export type SinglyLinkedListOperation =
  | { readonly type: 'insertHead'; readonly value: number }
  | { readonly type: 'insertTail'; readonly value: number }
  | { readonly type: 'toArray' };

export type SinglyLinkedListAnchor =
  | 'sll.insertHead.entry'
  | 'sll.insertHead.allocate'
  | 'sll.insertHead.link-next'
  | 'sll.insertHead.set-head'
  | 'sll.insertHead.set-tail'
  | 'sll.insertHead.done'
  | 'sll.insertTail.entry'
  | 'sll.insertTail.check-empty'
  | 'sll.insertTail.allocate'
  | 'sll.insertTail.set-head'
  | 'sll.insertTail.link-tail'
  | 'sll.insertTail.set-tail'
  | 'sll.insertTail.done'
  | 'sll.toArray.entry'
  | 'sll.toArray.visit'
  | 'sll.toArray.done';

export type SinglyLinkedListMessages = {
  'sll.insertHead.start': { value: number };
  'sll.insertHead.allocated': { value: number };
  'sll.insertHead.linked-next': { value: number; hasNext: boolean };
  'sll.insertHead.done': { value: number; size: number };
  'sll.insertTail.start': { value: number };
  'sll.insertTail.checking': { empty: boolean };
  'sll.insertTail.allocated': { value: number };
  'sll.insertTail.linked-tail': { tailValue: number; value: number };
  'sll.insertTail.done': { value: number; size: number };
  'sll.head.updated': { value: number };
  'sll.tail.updated': { value: number };
  'sll.toArray.start': { size: number };
  'sll.toArray.visit': { value: number; index: number };
  'sll.toArray.done': { size: number };
};

export interface SinglyLinkedListTypes {
  readonly state: LinkedListState;
  readonly operation: SinglyLinkedListOperation;
  readonly messages: SinglyLinkedListMessages;
  readonly anchors: SinglyLinkedListAnchor;
}

// ---------------------------------------------------------------------------------------------
// Leitura do estado (funções puras, sem registrar passos)
// ---------------------------------------------------------------------------------------------

function nodeById(state: LinkedListState, id: ElementId): ListNode {
  const node = state.nodes.find((n) => n.id === id);
  if (node === undefined) throw new EngineInvariantError(`Nó ${id} não existe no estado`);
  return node;
}

/**
 * Nós na ordem da lista: segue `next` a partir de `head`. É o que define "estar na lista":
 * um nó alocado, mas ainda não ligado, não aparece aqui.
 */
function nodesInOrder(state: LinkedListState): ListNode[] {
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

/** Tamanho da lista = nós alcançáveis a partir de `head`. */
function sizeOf(state: LinkedListState): number {
  return nodesInOrder(state).length;
}

function isEmpty(state: LinkedListState): boolean {
  return state.head === null;
}

/** Devolve um novo estado com o campo `next` do nó `id` trocado. */
function withNext(state: LinkedListState, id: ElementId, next: ElementId | null): LinkedListState {
  return { ...state, nodes: state.nodes.map((n) => (n.id === id ? { ...n, next } : n)) };
}

/** Ponteiros `head` e `tail` como destaques (só os que apontam para algum nó). */
function pointerHighlights(state: LinkedListState): Highlight[] {
  const out: Highlight[] = [];
  if (state.head !== null) out.push({ target: { type: 'element', id: state.head }, role: 'head' });
  if (state.tail !== null) out.push({ target: { type: 'element', id: state.tail }, role: 'tail' });
  return out;
}

// ---------------------------------------------------------------------------------------------
// Descritor
// ---------------------------------------------------------------------------------------------

const CONSTANT: Complexity = {
  time: { best: 'O(1)', average: 'O(1)', worst: 'O(1)' },
  space: 'O(1)',
  amortized: null,
};

const LINEAR_TRAVERSAL: Complexity = {
  time: { best: 'O(n)', average: 'O(n)', worst: 'O(n)' },
  space: 'O(n)',
  amortized: null,
};

const VALUE_PARAM = {
  name: 'value',
  role: 'value',
  min: LIMITS.minValue,
  max: LIMITS.maxValue,
} as const;

const singlyLinkedListDefinition: ItemDefinition<SinglyLinkedListTypes> = {
  descriptor: {
    id: 'singly-linked-list',
    labId: 'linked-lists',
    stateKind: 'linked-list',
    operations: [
      { type: 'insertHead', params: [VALUE_PARAM], complexity: CONSTANT },
      { type: 'insertTail', params: [VALUE_PARAM], complexity: CONSTANT },
      { type: 'toArray', params: [], complexity: LINEAR_TRAVERSAL },
    ],
    anchors: [
      'sll.insertHead.entry',
      'sll.insertHead.allocate',
      'sll.insertHead.link-next',
      'sll.insertHead.set-head',
      'sll.insertHead.set-tail',
      'sll.insertHead.done',
      'sll.insertTail.entry',
      'sll.insertTail.check-empty',
      'sll.insertTail.allocate',
      'sll.insertTail.set-head',
      'sll.insertTail.link-tail',
      'sll.insertTail.set-tail',
      'sll.insertTail.done',
      'sll.toArray.entry',
      'sll.toArray.visit',
      'sll.toArray.done',
    ],
    messageKeys: [
      'sll.insertHead.start',
      'sll.insertHead.allocated',
      'sll.insertHead.linked-next',
      'sll.insertHead.done',
      'sll.insertTail.start',
      'sll.insertTail.checking',
      'sll.insertTail.allocated',
      'sll.insertTail.linked-tail',
      'sll.insertTail.done',
      'sll.head.updated',
      'sll.tail.updated',
      'sll.toArray.start',
      'sll.toArray.visit',
      'sll.toArray.done',
    ],
    examples: [{ id: 'basic', values: [4, 8, 15] }],
  },

  createInitialState(values) {
    const last = values.length - 1;
    return {
      kind: 'linked-list',
      variant: 'singly',
      nextId: values.length,
      nodes: values.map((value, i) => ({
        id: elementId(i),
        value,
        next: i < last ? elementId(i + 1) : null,
        prev: null,
      })),
      head: values.length > 0 ? elementId(0) : null,
      tail: values.length > 0 ? elementId(last) : null,
    };
  },

  checkOperation(state, operation) {
    const inserts = operation.type === 'insertHead' || operation.type === 'insertTail';
    if (inserts && state.nodes.length >= LIMITS.maxElements) {
      return [{ code: 'LIMIT_EXCEEDED', path: 'value', meta: { min: 0, max: LIMITS.maxElements } }];
    }
    return [];
  },

  execute({ state, operation, recorder }) {
    switch (operation.type) {
      case 'insertHead': {
        const { value } = operation;
        const wasEmpty = isEmpty(state);
        recorder.step({
          state,
          highlights: pointerHighlights(state),
          message: { key: 'sll.insertHead.start', params: { value } },
          anchor: 'sll.insertHead.entry',
        });

        // 1. O nó nasce solto: existe no estado, mas ninguém aponta para ele.
        const newId = elementId(state.nextId);
        const allocated: LinkedListState = {
          ...state,
          nextId: state.nextId + 1,
          nodes: [...state.nodes, { id: newId, value, next: null, prev: null }],
        };
        recorder.step({
          state: allocated,
          highlights: [{ target: { type: 'element', id: newId }, role: 'inserted' }],
          message: { key: 'sll.insertHead.allocated', params: { value } },
          anchor: 'sll.insertHead.allocate',
        });

        // 2. O novo nó aponta para o antigo início (ou para nada, se a lista estava vazia).
        const linked = withNext(allocated, newId, state.head);
        const linkHighlights: Highlight[] = [
          { target: { type: 'element', id: newId }, role: 'inserted' },
        ];
        if (state.head !== null) {
          linkHighlights.push(
            { target: { type: 'element', id: state.head }, role: 'head' },
            { target: { type: 'edge', from: newId, to: state.head }, role: 'inserted' },
          );
        }
        recorder.move();
        recorder.step({
          state: linked,
          highlights: linkHighlights,
          message: {
            key: 'sll.insertHead.linked-next',
            params: { value, hasNext: state.head !== null },
          },
          anchor: 'sll.insertHead.link-next',
        });

        // 3. O início da lista passa a ser o novo nó.
        let current: LinkedListState = { ...linked, head: newId };
        recorder.move();
        recorder.step({
          state: current,
          highlights: [{ target: { type: 'element', id: newId }, role: 'head' }],
          message: { key: 'sll.head.updated', params: { value } },
          anchor: 'sll.insertHead.set-head',
        });

        // 4. Lista que estava vazia: o único nó também é o último.
        if (wasEmpty) {
          current = { ...current, tail: newId };
          recorder.move();
          recorder.step({
            state: current,
            highlights: [{ target: { type: 'element', id: newId }, role: 'tail' }],
            message: { key: 'sll.tail.updated', params: { value } },
            anchor: 'sll.insertHead.set-tail',
          });
        }

        recorder.step({
          state: current,
          highlights: [{ target: { type: 'element', id: newId }, role: 'inserted' }],
          message: { key: 'sll.insertHead.done', params: { value, size: sizeOf(current) } },
          anchor: 'sll.insertHead.done',
        });
        return { outcome: 'completed', finalState: current, result: { type: 'none' } };
      }

      case 'insertTail': {
        const { value } = operation;
        recorder.step({
          state,
          highlights: pointerHighlights(state),
          message: { key: 'sll.insertTail.start', params: { value } },
          anchor: 'sll.insertTail.entry',
        });

        const wasEmpty = isEmpty(state);
        recorder.step({
          state,
          highlights: pointerHighlights(state),
          message: { key: 'sll.insertTail.checking', params: { empty: wasEmpty } },
          anchor: 'sll.insertTail.check-empty',
        });

        const newId = elementId(state.nextId);
        const allocated: LinkedListState = {
          ...state,
          nextId: state.nextId + 1,
          nodes: [...state.nodes, { id: newId, value, next: null, prev: null }],
        };
        recorder.step({
          state: allocated,
          highlights: [{ target: { type: 'element', id: newId }, role: 'inserted' }],
          message: { key: 'sll.insertTail.allocated', params: { value } },
          anchor: 'sll.insertTail.allocate',
        });

        let current: LinkedListState = allocated;
        if (state.tail === null) {
          // Lista vazia: o novo nó é, ao mesmo tempo, início e fim.
          current = { ...current, head: newId };
          recorder.move();
          recorder.step({
            state: current,
            highlights: [{ target: { type: 'element', id: newId }, role: 'head' }],
            message: { key: 'sll.head.updated', params: { value } },
            anchor: 'sll.insertTail.set-head',
          });
        } else {
          // Lista com elementos: o último nó passa a apontar para o novo.
          const oldTail = nodeById(state, state.tail);
          recorder.access();
          current = withNext(current, oldTail.id, newId);
          recorder.move();
          recorder.step({
            state: current,
            highlights: [
              { target: { type: 'element', id: oldTail.id }, role: 'tail' },
              { target: { type: 'element', id: newId }, role: 'inserted' },
              { target: { type: 'edge', from: oldTail.id, to: newId }, role: 'inserted' },
            ],
            message: {
              key: 'sll.insertTail.linked-tail',
              params: { tailValue: oldTail.value, value },
            },
            anchor: 'sll.insertTail.link-tail',
          });
        }

        current = { ...current, tail: newId };
        recorder.move();
        recorder.step({
          state: current,
          highlights: [{ target: { type: 'element', id: newId }, role: 'tail' }],
          message: { key: 'sll.tail.updated', params: { value } },
          anchor: 'sll.insertTail.set-tail',
        });

        recorder.step({
          state: current,
          highlights: [{ target: { type: 'element', id: newId }, role: 'inserted' }],
          message: { key: 'sll.insertTail.done', params: { value, size: sizeOf(current) } },
          anchor: 'sll.insertTail.done',
        });
        return { outcome: 'completed', finalState: current, result: { type: 'none' } };
      }

      case 'toArray': {
        const ordered = nodesInOrder(state);
        recorder.step({
          state,
          highlights: pointerHighlights(state),
          message: { key: 'sll.toArray.start', params: { size: ordered.length } },
          anchor: 'sll.toArray.entry',
        });

        const values: number[] = [];
        const visited: Highlight[] = [];
        ordered.forEach((node, index) => {
          recorder.access();
          values.push(node.value);
          recorder.step({
            state,
            highlights: [...visited, { target: { type: 'element', id: node.id }, role: 'current' }],
            message: { key: 'sll.toArray.visit', params: { value: node.value, index } },
            anchor: 'sll.toArray.visit',
          });
          visited.push({ target: { type: 'element', id: node.id }, role: 'visited' });
        });

        recorder.step({
          state,
          highlights: visited,
          message: { key: 'sll.toArray.done', params: { size: values.length } },
          anchor: 'sll.toArray.done',
        });
        return { outcome: 'completed', finalState: state, result: { type: 'values', values } };
      }
    }
  },
};

export const singlyLinkedListItem = defineItem(singlyLinkedListDefinition);
