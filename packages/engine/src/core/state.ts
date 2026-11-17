import type { ElementId } from './ids';

/** Todo estado tem um discriminante (`kind`) e o contador que gera as próximas identidades. */
interface StateBase<K extends string> {
  readonly kind: K;
  /** Próxima identidade a ser atribuída; mantém a geração de ids determinística. */
  readonly nextId: number;
}

export interface Element {
  readonly id: ElementId;
  readonly value: number;
}

/** Vetores e algoritmos de ordenação/busca. Áreas auxiliares (merge sort, counting sort) ficam à parte. */
export interface SequenceState extends StateBase<'sequence'> {
  readonly elements: readonly Element[];
  readonly auxiliary: readonly { readonly name: string; readonly elements: readonly Element[] }[];
}

/** Pilha: do FUNDO para o TOPO. */
export interface StackState extends StateBase<'stack'> {
  readonly elements: readonly Element[];
}

/** Fila: da FRENTE para o FIM. */
export interface QueueState extends StateBase<'queue'> {
  readonly elements: readonly Element[];
}

/** Lista ligada: nós por referência de ID, nunca por referência de objeto (sem ciclos). */
export interface ListNode {
  readonly id: ElementId;
  readonly value: number;
  readonly next: ElementId | null;
  /** `null` em listas simples. */
  readonly prev: ElementId | null;
}
export interface LinkedListState extends StateBase<'linked-list'> {
  readonly variant: 'singly' | 'doubly' | 'circular';
  /** TODOS os nós alocados (inclusive ainda não ligados durante uma inserção), ordenados por id. */
  readonly nodes: readonly ListNode[];
  readonly head: ElementId | null;
  readonly tail: ElementId | null;
}

export interface BinaryTreeNode {
  readonly id: ElementId;
  readonly value: number;
  readonly left: ElementId | null;
  readonly right: ElementId | null;
}
export interface BinaryTreeState extends StateBase<'binary-tree'> {
  readonly nodes: readonly BinaryTreeNode[];
  readonly root: ElementId | null;
}

/** Heap implícito em vetor: filhos de i em 2i+1 e 2i+2. A árvore é só uma visão derivada. */
export interface HeapState extends StateBase<'heap'> {
  readonly order: 'min' | 'max';
  readonly elements: readonly Element[];
}

export interface HashEntry {
  readonly id: ElementId;
  readonly key: number;
  readonly value: number;
}
export interface HashTableState extends StateBase<'hash-table'> {
  readonly capacity: number;
  /** Encadeamento: sempre `capacity` baldes, cada um com sua lista de entradas. */
  readonly buckets: readonly { readonly index: number; readonly entries: readonly HashEntry[] }[];
}

export interface GraphVertex {
  readonly id: ElementId;
  /** Rótulo de exibição (dado, não frase): "A", "B"... */
  readonly label: string;
}
export interface GraphEdge {
  readonly id: ElementId;
  readonly from: ElementId;
  readonly to: ElementId;
  readonly weight: number | null;
}
export interface GraphState extends StateBase<'graph'> {
  readonly directed: boolean;
  readonly vertices: readonly GraphVertex[];
  readonly edges: readonly GraphEdge[];
}

export type StructureState =
  | SequenceState
  | StackState
  | QueueState
  | LinkedListState
  | BinaryTreeState
  | HeapState
  | HashTableState
  | GraphState;

export type StructureKind = StructureState['kind'];
