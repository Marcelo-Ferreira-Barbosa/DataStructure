/**
 * Reprodução dos passos como máquina de estados PURA (ARCHITECTURE §12; INTERFACE.md §9.3).
 * Não conhece React, relógio nem Engine: só recebe quantos passos existem. "Terminou" não é um
 * estado guardado: é derivado (`isFinished`), para não haver dois jeitos de dizer a mesma coisa.
 */

export const SPEEDS = [0.5, 1, 2, 4] as const;
export type Speed = (typeof SPEEDS)[number];

export type PlaybackStatus = 'idle' | 'playing' | 'paused';

export interface PlaybackState {
  /** Quantos passos tem a execução em exibição (0 quando não há execução). */
  readonly stepCount: number;
  /** Índice do passo atual, sempre dentro de `[0, stepCount - 1]` (0 sem execução). */
  readonly cursor: number;
  readonly status: PlaybackStatus;
  readonly speed: Speed;
}

export type PlaybackAction =
  | { readonly type: 'load'; readonly stepCount: number; readonly autoplay: boolean }
  | { readonly type: 'clear' }
  | { readonly type: 'play' }
  | { readonly type: 'pause' }
  | { readonly type: 'next' }
  | { readonly type: 'previous' }
  | { readonly type: 'first' }
  | { readonly type: 'last' }
  | { readonly type: 'restart' }
  | { readonly type: 'seek'; readonly index: number }
  | { readonly type: 'tick' }
  | { readonly type: 'setSpeed'; readonly speed: Speed };

export const initialPlayback: PlaybackState = {
  stepCount: 0,
  cursor: 0,
  status: 'idle',
  speed: 1,
};

export function isFinished(state: PlaybackState): boolean {
  return state.stepCount > 0 && state.cursor === state.stepCount - 1 && state.status !== 'playing';
}

export function canGoBack(state: PlaybackState): boolean {
  return state.stepCount > 0 && state.cursor > 0;
}

export function canGoForward(state: PlaybackState): boolean {
  return state.stepCount > 0 && state.cursor < state.stepCount - 1;
}

/** Ponto único que aplica a regra "ao chegar no último passo, a reprodução para". */
function settle(state: PlaybackState): PlaybackState {
  if (state.status === 'playing' && state.cursor >= state.stepCount - 1) {
    return { ...state, status: 'paused' };
  }
  return state;
}

function moveTo(state: PlaybackState, index: number, status: PlaybackStatus): PlaybackState {
  if (state.stepCount === 0) return state;
  const cursor = Math.min(Math.max(Math.trunc(index), 0), state.stepCount - 1);
  return settle({ ...state, cursor, status });
}

export function playbackReducer(state: PlaybackState, action: PlaybackAction): PlaybackState {
  switch (action.type) {
    case 'load': {
      if (action.stepCount <= 0) return { ...state, stepCount: 0, cursor: 0, status: 'idle' };
      return settle({
        ...state,
        stepCount: action.stepCount,
        cursor: 0,
        status: action.autoplay ? 'playing' : 'paused',
      });
    }
    case 'clear':
      return { ...state, stepCount: 0, cursor: 0, status: 'idle' };
    case 'play':
      if (state.stepCount === 0) return state;
      // No último passo, "reproduzir" recomeça do primeiro.
      return state.cursor >= state.stepCount - 1
        ? settle({ ...state, cursor: 0, status: 'playing' })
        : { ...state, status: 'playing' };
    case 'pause':
      return state.status === 'playing' ? { ...state, status: 'paused' } : state;
    // Navegar à mão sempre pausa (ARCHITECTURE §8.4).
    case 'next':
      return moveTo(state, state.cursor + 1, 'paused');
    case 'previous':
      return moveTo(state, state.cursor - 1, 'paused');
    case 'first':
    case 'restart':
      return moveTo(state, 0, 'paused');
    case 'last':
      return moveTo(state, state.stepCount - 1, 'paused');
    case 'seek':
      return moveTo(state, action.index, 'paused');
    case 'tick':
      // O relógio pode disparar um tick atrasado depois de uma pausa: só vale se está tocando.
      return state.status === 'playing' ? settle({ ...state, cursor: state.cursor + 1 }) : state;
    case 'setSpeed':
      return { ...state, speed: action.speed };
  }
}
