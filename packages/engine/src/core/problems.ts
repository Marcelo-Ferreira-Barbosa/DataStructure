/** Mesmos códigos de campo da API (API.md §2.10), mais LIMIT_EXCEEDED (ERR-003). */
export type InputProblemCode =
  'REQUIRED' | 'INVALID_TYPE' | 'OUT_OF_RANGE' | 'NOT_ALLOWED' | 'LIMIT_EXCEEDED';

export interface InputProblem {
  readonly code: InputProblemCode;
  /** Caminho do campo: "value", "operations[3].position"... */
  readonly path: string;
  readonly meta: { readonly min: number; readonly max: number } | null;
}

export type PreconditionCode = 'INPUT_NOT_SORTED';
export interface PreconditionProblem {
  readonly code: PreconditionCode;
}

/** Operação válida, mas impossível NESTE estado: vira execução curta e entra no histórico. */
export type RejectionReason = 'EMPTY_STRUCTURE' | 'POSITION_OUT_OF_RANGE' | 'VALUE_NOT_FOUND';

/** Única exceção da Engine: violação de invariante = erro de programação, nunca erro de usuário. */
export class EngineInvariantError extends Error {
  override readonly name = 'EngineInvariantError';
}
