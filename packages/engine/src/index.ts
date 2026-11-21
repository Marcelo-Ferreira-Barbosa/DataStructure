/**
 * Porta de entrada pública da Engine (ADR-0002): ÚNICA forma de usar o pacote.
 * Pacote puro: sem dependências, sem DOM, sem Node, sem relógio, sem aleatoriedade nativa.
 */

export { ENGINE_REVISION } from './core/revision';
export { LIMITS } from './core/limits';
export { createRng, generateRandomValues } from './core/rng';
export type { Rng } from './core/rng';
export { replay } from './core/replay';
export { listItems, getItem } from './catalog/registry';
export { EngineInvariantError } from './core/problems';
export { inspectState } from './core/inspect';

export type { ElementId, ItemId, LabId } from './core/ids';
export type { Bound, Complexity } from './core/complexity';
export type { Message, MessageCatalog, MessageParams } from './core/message';
export type { ItemTypes, Operation } from './core/item-types';
export type { Counters, Highlight, HighlightRole, HighlightTarget, Step } from './core/step';
export type {
  Execution,
  ExecutionMetadata,
  ExecutionResult,
  OperationAttempt,
  OperationSummary,
  ReplayResult,
} from './core/execution';
export type {
  ExampleDescriptor,
  InitialStateResult,
  Item,
  ItemDescriptor,
  OperationDescriptor,
  ParamDescriptor,
} from './core/item';
export type {
  InputProblem,
  InputProblemCode,
  PreconditionCode,
  PreconditionProblem,
  RejectionReason,
} from './core/problems';
export type {
  BinaryTreeNode,
  BinaryTreeState,
  Element,
  GraphEdge,
  GraphState,
  GraphVertex,
  HashEntry,
  HashTableState,
  HeapState,
  LinkedListState,
  ListNode,
  QueueState,
  SequenceState,
  StackState,
  StructureKind,
  StructureState,
} from './core/state';

// Tipos do item "lista simplesmente encadeada" (ADR-0004: o catálogo de textos da interface é
// tipado por eles, então uma chave ou âncora sem texto vira erro de compilação). Só tipos.
export type {
  SinglyLinkedListAnchor,
  SinglyLinkedListMessages,
  SinglyLinkedListOperation,
} from './labs/linked-lists/singly-linked-list/types';
