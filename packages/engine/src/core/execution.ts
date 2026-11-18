import type { Complexity } from './complexity';
import type { ElementId, ItemId, LabId } from './ids';
import type { InputProblem, PreconditionProblem, RejectionReason } from './problems';
import type { ItemTypes } from './item-types';
import type { Counters, Step } from './step';
import type { StructureState } from './state';

export type ExecutionResult =
  | { readonly type: 'none' }
  | { readonly type: 'value'; readonly value: number }
  /** Conteúdo lido da estrutura, na ordem (ex.: `toArray` da lista ligada). */
  | { readonly type: 'values'; readonly values: readonly number[] }
  | { readonly type: 'found'; readonly id: ElementId; readonly index: number }
  | { readonly type: 'not-found' };

export interface ExecutionMetadata {
  readonly itemId: ItemId;
  readonly labId: LabId;
  /** Revisão do comportamento da Engine que gerou esta execução (ADR-0006). */
  readonly engineRevision: number;
  readonly elementsBefore: number;
  readonly elementsAfter: number;
  readonly stepCount: number;
  readonly rejection: RejectionReason | null;
  readonly counters: Counters;
}

/** Resultado de uma simulação. Tudo aqui sobrevive a JSON.stringify/JSON.parse sem perdas. */
export interface Execution<T extends ItemTypes = ItemTypes> {
  /** Nome da operação (igual a `operation.type`), para listagens e histórico. */
  readonly operationName: T['operation']['type'];
  readonly operation: T['operation'];
  readonly outcome: 'completed' | 'rejected';
  readonly initialState: T['state'];
  readonly finalState: T['state'];
  readonly steps: readonly Step<T>[];
  readonly result: ExecutionResult;
  /** Complexidade TEÓRICA declarada no descritor; as contagens reais estão nos contadores. */
  readonly complexity: Complexity;
  readonly metadata: ExecutionMetadata;
}

/** Os quatro desfechos de uma tentativa (ARCHITECTURE.md §7.4). */
export type OperationAttempt<T extends ItemTypes = ItemTypes> =
  | { readonly outcome: 'invalid-input'; readonly problems: readonly InputProblem[] }
  | { readonly outcome: 'precondition-failed'; readonly problem: PreconditionProblem }
  | { readonly outcome: 'rejected' | 'completed'; readonly execution: Execution<T> };

export interface OperationSummary {
  readonly operationName: string;
  readonly outcome: 'completed' | 'rejected';
  readonly stepCount: number;
  readonly counters: Counters;
}

/** Reproduzir uma receita salva (ADR-0006) não guarda passos: só o estado final e resumos. */
export type ReplayResult =
  | {
      readonly ok: true;
      readonly finalState: StructureState;
      readonly summaries: readonly OperationSummary[];
    }
  | {
      readonly ok: false;
      /** Índice da operação que não pôde ser reproduzida; `null` quando o problema é global. */
      readonly failedAt: number | null;
      readonly reason:
        'invalid-initial-data' | 'too-many-operations' | 'invalid-input' | 'precondition-failed';
    };
