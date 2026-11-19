import type { LinkedListState } from '../../../core/state';

type NoParams = { readonly [name: string]: never };

/**
 * Operações da lista. `position` é um índice a partir de 0 (0 = primeiro nó).
 * Posição negativa, não inteira ou acima de 49 é entrada inválida (barrada pelo descritor);
 * posição que não existe NESTA lista é rejeição (`POSITION_OUT_OF_RANGE`).
 */
export type SinglyLinkedListOperation =
  | { readonly type: 'insertHead'; readonly value: number }
  | { readonly type: 'insertTail'; readonly value: number }
  | { readonly type: 'insertAt'; readonly position: number; readonly value: number }
  | { readonly type: 'removeHead' }
  | { readonly type: 'removeTail' }
  | { readonly type: 'removeAt'; readonly position: number }
  | { readonly type: 'search'; readonly value: number }
  | { readonly type: 'getAt'; readonly position: number }
  | { readonly type: 'traverse' }
  | { readonly type: 'toArray' };

export type SinglyLinkedListAnchor =
  // insertHead
  | 'sll.insertHead.entry'
  | 'sll.insertHead.allocate'
  | 'sll.insertHead.link-next'
  | 'sll.insertHead.set-head'
  | 'sll.insertHead.set-tail'
  | 'sll.insertHead.done'
  // insertTail
  | 'sll.insertTail.entry'
  | 'sll.insertTail.check-empty'
  | 'sll.insertTail.allocate'
  | 'sll.insertTail.set-head'
  | 'sll.insertTail.link-tail'
  | 'sll.insertTail.set-tail'
  | 'sll.insertTail.done'
  // insertAt
  | 'sll.insertAt.entry'
  | 'sll.insertAt.check-position'
  | 'sll.insertAt.walk'
  | 'sll.insertAt.allocate'
  | 'sll.insertAt.link-next'
  | 'sll.insertAt.link-previous'
  | 'sll.insertAt.done'
  // removeHead
  | 'sll.removeHead.check-empty'
  | 'sll.removeHead.read'
  | 'sll.removeHead.set-head'
  | 'sll.removeHead.set-tail'
  | 'sll.removeHead.done'
  // removeTail
  | 'sll.removeTail.check-empty'
  | 'sll.removeTail.delegate'
  // removeAt
  | 'sll.removeAt.check-position'
  | 'sll.removeAt.walk'
  | 'sll.removeAt.read-target'
  | 'sll.removeAt.unlink'
  | 'sll.removeAt.set-tail'
  | 'sll.removeAt.done'
  // search
  | 'sll.search.entry'
  | 'sll.search.compare'
  | 'sll.search.found'
  | 'sll.search.not-found'
  // getAt
  | 'sll.getAt.check-position'
  | 'sll.getAt.walk'
  | 'sll.getAt.done'
  // traverse
  | 'sll.traverse.entry'
  | 'sll.traverse.visit'
  | 'sll.traverse.done'
  // toArray
  | 'sll.toArray.entry'
  | 'sll.toArray.visit'
  | 'sll.toArray.done';

export type SinglyLinkedListMessages = {
  // compartilhadas
  'sll.empty': NoParams;
  'sll.position.out-of-range': { position: number; size: number };
  'sll.head.updated': { value: number };
  'sll.tail.updated': { value: number };
  'sll.tail.cleared': NoParams;
  // insertHead
  'sll.insertHead.start': { value: number };
  'sll.insertHead.allocated': { value: number };
  'sll.insertHead.linked-next': { value: number; hasNext: boolean };
  'sll.insertHead.done': { value: number; size: number };
  // insertTail
  'sll.insertTail.start': { value: number };
  'sll.insertTail.checking': { empty: boolean };
  'sll.insertTail.allocated': { value: number };
  'sll.insertTail.linked-tail': { tailValue: number; value: number };
  'sll.insertTail.done': { value: number; size: number };
  // insertAt
  'sll.insertAt.start': { position: number; value: number };
  'sll.insertAt.at-head': NoParams;
  'sll.insertAt.at-tail': NoParams;
  'sll.insertAt.visit': { value: number; index: number };
  'sll.insertAt.allocated': { value: number };
  'sll.insertAt.linked-next': { value: number; nextValue: number };
  'sll.insertAt.linked-previous': { previousValue: number; value: number };
  'sll.insertAt.done': { value: number; position: number; size: number };
  // removeHead
  'sll.removeHead.start': NoParams;
  'sll.removeHead.reading': { value: number };
  'sll.removeHead.head-moved': { hasNext: boolean };
  'sll.removeHead.done': { value: number; size: number };
  // removeTail
  'sll.removeTail.start': NoParams;
  'sll.removeTail.delegate': { position: number };
  // removeAt
  'sll.removeAt.start': { position: number };
  'sll.removeAt.at-head': NoParams;
  'sll.removeAt.visit': { value: number; index: number };
  'sll.removeAt.target': { value: number; position: number };
  'sll.removeAt.unlinked': { previousValue: number; hasNext: boolean };
  'sll.removeAt.done': { value: number; size: number };
  // search
  'sll.search.start': { value: number };
  'sll.search.compare': { candidate: number; value: number; index: number; equal: boolean };
  'sll.search.found': { value: number; index: number };
  'sll.search.not-found': { value: number };
  // getAt
  'sll.getAt.start': { position: number };
  'sll.getAt.visit': { value: number; index: number };
  'sll.getAt.done': { value: number; position: number };
  // traverse
  'sll.traverse.start': { size: number };
  'sll.traverse.visit': { value: number; index: number };
  'sll.traverse.done': { size: number };
  // toArray
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
