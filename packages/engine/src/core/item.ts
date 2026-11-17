import type { Complexity } from './complexity';
import type { ExecutionResult, OperationAttempt } from './execution';
import type { ItemId, LabId } from './ids';
import type { ItemTypes } from './item-types';
import type { Message } from './message';
import type { InputProblem, PreconditionProblem, RejectionReason } from './problems';
import type { StructureKind, StructureState } from './state';
import type { Highlight } from './step';

// ---------- Descritor: dados que descrevem o item (a UI monta o painel a partir dele) ----------

export interface ParamDescriptor {
  readonly name: string;
  readonly role: 'value' | 'position' | 'target';
  readonly min: number;
  readonly max: number;
}

export interface OperationDescriptor<K extends string = string> {
  readonly type: K;
  readonly params: readonly ParamDescriptor[];
  readonly complexity: Complexity;
}

export interface ExampleDescriptor {
  readonly id: string;
  readonly values: readonly number[];
}

/** Descritor SEM genéricos: é o que o catálogo e o Web enxergam. */
export interface ItemDescriptor {
  readonly id: ItemId;
  readonly labId: LabId;
  /** Tipo visual/estrutural: decide qual visualizador o Web usa (ADR-0011). */
  readonly stateKind: StructureKind;
  readonly operations: readonly OperationDescriptor[];
  /** Todas as âncoras de pseudocódigo que o item pode emitir. */
  readonly anchors: readonly string[];
  /** Todas as chaves de mensagem que o item pode emitir (permite verificar em teste). */
  readonly messageKeys: readonly string[];
  readonly examples: readonly ExampleDescriptor[];
}

/** Descritor tipado, usado por quem escreve o item: amarra operações, âncoras e chaves aos seus tipos. */
export interface TypedItemDescriptor<T extends ItemTypes> extends ItemDescriptor {
  readonly operations: readonly OperationDescriptor<T['operation']['type']>[];
  readonly anchors: readonly T['anchors'][];
  readonly messageKeys: readonly (keyof T['messages'] & string)[];
}

// ---------- Registrador de passos: a ÚNICA forma de produzir passos e contar ----------

export interface StepFrame<T extends ItemTypes> {
  /** Estado da estrutura NESTE instante (novo objeto; nunca altere um estado já registrado). */
  readonly state: T['state'];
  readonly message: Message<T['messages']>;
  readonly anchor: T['anchors'] | null;
  readonly highlights?: readonly Highlight[];
}

export interface StepRecorder<T extends ItemTypes> {
  /** Fecha um passo: congela estado, destaques, mensagem e os contadores acumulados até aqui. */
  step(frame: StepFrame<T>): void;
  /** Só o registrador altera contadores: o algoritmo declara o que fez, não faz a conta. */
  compare(times?: number): void;
  move(times?: number): void;
  access(times?: number): void;
}

// ---------- Definição: o que o autor de um item escreve ----------

export interface ExecuteContext<T extends ItemTypes> {
  readonly state: T['state'];
  readonly operation: T['operation'];
  readonly recorder: StepRecorder<T>;
}

export type ExecuteOutcome<T extends ItemTypes> =
  | {
      readonly outcome: 'completed';
      readonly finalState: T['state'];
      readonly result: ExecutionResult;
    }
  | { readonly outcome: 'rejected'; readonly reason: RejectionReason };

export interface ItemDefinition<T extends ItemTypes> {
  readonly descriptor: TypedItemDescriptor<T>;

  /** Recebe valores JÁ validados (quantidade, inteiros, faixa) e devolve o estado inicial. */
  createInitialState(values: readonly number[]): T['state'];

  /** Entrada inválida que depende do estado (limite de elementos, ERR-003). Opcional. */
  checkOperation?(state: T['state'], operation: T['operation']): readonly InputProblem[];

  /** Pré-condição de dados (ex.: busca binária exige ordem, ERR-007). Opcional. */
  checkPrecondition?(state: T['state'], operation: T['operation']): PreconditionProblem | null;

  /**
   * Executa a operação registrando passos. Pode terminar `completed` ou `rejected`
   * (operação válida, mas impossível neste estado: ERR-004 a ERR-006).
   */
  execute(context: ExecuteContext<T>): ExecuteOutcome<T>;
}

// ---------- Fachada pública, SEM genéricos: o que o catálogo e o Web enxergam ----------

export type InitialStateResult =
  | { readonly ok: true; readonly state: StructureState }
  | { readonly ok: false; readonly problems: readonly InputProblem[] };

export interface Item {
  readonly descriptor: ItemDescriptor;
  /** `values` chega como `unknown` (JSON, formulário): a fachada valida antes de usar. */
  createInitialState(values: unknown): InitialStateResult;
  /** `operation` também é `unknown`. Nunca lança por entrada do usuário. */
  run(state: StructureState, operation: unknown): OperationAttempt;
}
