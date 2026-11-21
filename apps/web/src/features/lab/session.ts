import type { Execution, InputProblem, Item, PreconditionCode, StructureState } from '@dss/engine';
import { initialPlayback, playbackReducer, type PlaybackState } from './playback';

/** Uma operação já executada, preservada com todos os seus passos (imutáveis). */
export interface HistoryEntry {
  readonly id: number;
  readonly execution: Execution;
}

/** Por que o último pedido não gerou execução. */
export type Feedback =
  | { readonly source: 'operation' | 'list'; readonly problems: readonly InputProblem[] }
  | { readonly source: 'precondition'; readonly code: PreconditionCode }
  | { readonly source: 'internal'; readonly message: string };

export interface LabSession {
  /** A lista "em repouso": o estado depois da última operação (ou o inicial). */
  readonly structure: StructureState;
  readonly history: readonly HistoryEntry[];
  /** A execução em exibição, ou `null` antes da primeira operação. */
  readonly execution: Execution | null;
  readonly playback: PlaybackState;
  readonly feedback: Feedback | null;
  /** Semente da última lista aleatória (visível, para repetir a mesma lista). */
  readonly seed: number;
}

export function emptySession(structure: StructureState, seed = 1): LabSession {
  return {
    structure,
    history: [],
    execution: null,
    playback: initialPlayback,
    feedback: null,
    seed,
  };
}

/** Falha inesperada da Engine (defeito, não erro do usuário): vira mensagem, não derruba a tela. */
function internalFailure(error: unknown): Feedback {
  const detail = error instanceof Error ? error.message : String(error);
  return { source: 'internal', message: detail };
}

/** Cria uma lista nova: o histórico e a execução anteriores deixam de existir. */
export function createList(
  item: Item,
  session: LabSession,
  values: unknown,
  seed: number = session.seed,
): LabSession {
  try {
    const created = item.createInitialState(values);
    if (!created.ok) {
      // Lista inválida: nada muda além do aviso (a sessão atual continua intacta).
      return { ...session, feedback: { source: 'list', problems: created.problems } };
    }
    return {
      ...emptySession(created.state, seed),
      playback: { ...initialPlayback, speed: session.playback.speed },
    };
  } catch (error) {
    return { ...session, feedback: internalFailure(error) };
  }
}

/**
 * Executa UMA operação na Engine e incorpora o resultado.
 * - `completed` / `rejected`: gera execução, entra no histórico e passa a ser exibida;
 *   a lista em repouso vira o estado final (que, numa recusa, é igual ao inicial).
 * - `invalid-input` / `precondition-failed`: não há execução; só `feedback`.
 * Uma execução em andamento é simplesmente substituída na exibição: ela já está no histórico e
 * seu estado final já é a lista em repouso, então nada se perde (Q97).
 */
export function runOperation(
  item: Item,
  session: LabSession,
  operation: unknown,
  autoplay: boolean,
): LabSession {
  let attempt;
  try {
    attempt = item.run(session.structure, operation);
  } catch (error) {
    return { ...session, feedback: internalFailure(error) };
  }

  if (attempt.outcome === 'invalid-input') {
    return { ...session, feedback: { source: 'operation', problems: attempt.problems } };
  }
  if (attempt.outcome === 'precondition-failed') {
    return { ...session, feedback: { source: 'precondition', code: attempt.problem.code } };
  }

  const { execution } = attempt;
  const entry: HistoryEntry = { id: session.history.length + 1, execution };
  return {
    ...session,
    structure: execution.finalState,
    history: [...session.history, entry],
    execution,
    playback: playbackReducer(session.playback, {
      type: 'load',
      stepCount: execution.steps.length,
      autoplay,
    }),
    feedback: null,
  };
}
