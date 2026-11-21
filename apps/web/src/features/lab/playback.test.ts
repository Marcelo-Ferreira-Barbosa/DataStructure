import { describe, expect, it } from 'vitest';
import {
  canGoBack,
  canGoForward,
  initialPlayback,
  isFinished,
  playbackReducer,
  type PlaybackAction,
  type PlaybackState,
} from './playback';

const run = (state: PlaybackState, ...actions: PlaybackAction[]): PlaybackState =>
  actions.reduce(playbackReducer, state);

const loaded = (stepCount: number, autoplay = false): PlaybackState =>
  playbackReducer(initialPlayback, { type: 'load', stepCount, autoplay });

describe('carregar uma execução', () => {
  it('começa no passo 0, tocando ou pausada conforme a política', () => {
    expect(loaded(5, true)).toMatchObject({ cursor: 0, status: 'playing', stepCount: 5 });
    expect(loaded(5, false)).toMatchObject({ cursor: 0, status: 'paused', stepCount: 5 });
  });

  it('uma execução de 1 passo já termina (não fica "tocando" num passo só)', () => {
    const state = loaded(1, true);
    expect(state.status).toBe('paused');
    expect(isFinished(state)).toBe(true);
  });

  it('zero passos equivale a nenhuma execução', () => {
    expect(loaded(0, true)).toMatchObject({ stepCount: 0, status: 'idle' });
  });

  it('preserva a velocidade escolhida', () => {
    const fast = run(initialPlayback, { type: 'setSpeed', speed: 4 });
    expect(playbackReducer(fast, { type: 'load', stepCount: 3, autoplay: true }).speed).toBe(4);
  });
});

describe('navegação passo a passo', () => {
  it('avançar e retroceder movem o cursor e pausam', () => {
    let state = loaded(4, true);
    state = run(state, { type: 'next' });
    expect(state).toMatchObject({ cursor: 1, status: 'paused' });
    state = run(state, { type: 'next' }, { type: 'previous' });
    expect(state.cursor).toBe(1);
  });

  it('nunca sai do intervalo [0, último]', () => {
    let state = loaded(3);
    state = run(state, { type: 'previous' }, { type: 'previous' });
    expect(state.cursor).toBe(0);
    state = run(state, { type: 'next' }, { type: 'next' }, { type: 'next' }, { type: 'next' });
    expect(state.cursor).toBe(2);
    state = run(state, { type: 'seek', index: 99 });
    expect(state.cursor).toBe(2);
    state = run(state, { type: 'seek', index: -5 });
    expect(state.cursor).toBe(0);
  });

  it('seek com número fracionário vira índice inteiro', () => {
    expect(run(loaded(5), { type: 'seek', index: 2.9 }).cursor).toBe(2);
  });

  it('canGoBack e canGoForward refletem as bordas', () => {
    expect(canGoBack(loaded(3))).toBe(false);
    expect(canGoForward(loaded(3))).toBe(true);
    const end = run(loaded(3), { type: 'last' });
    expect(canGoBack(end)).toBe(true);
    expect(canGoForward(end)).toBe(false);
    expect(canGoBack(initialPlayback)).toBe(false);
    expect(canGoForward(initialPlayback)).toBe(false);
  });

  it('sem execução, nenhuma ação de navegação faz nada', () => {
    for (const type of ['next', 'previous', 'first', 'last', 'restart', 'play'] as const) {
      expect(playbackReducer(initialPlayback, { type })).toBe(initialPlayback);
    }
    expect(playbackReducer(initialPlayback, { type: 'seek', index: 3 })).toBe(initialPlayback);
  });
});

describe('reprodução automática', () => {
  it('cada tick avança um passo e, no último, para', () => {
    let state = loaded(3, true);
    state = run(state, { type: 'tick' });
    expect(state).toMatchObject({ cursor: 1, status: 'playing' });
    state = run(state, { type: 'tick' });
    expect(state).toMatchObject({ cursor: 2, status: 'paused' });
    expect(isFinished(state)).toBe(true);
  });

  it('um tick atrasado depois de pausar é ignorado', () => {
    const paused = run(loaded(5, true), { type: 'tick' }, { type: 'pause' });
    expect(run(paused, { type: 'tick' })).toBe(paused);
  });

  it('pausar e retomar mantém o passo', () => {
    let state = run(loaded(5, true), { type: 'tick' }, { type: 'tick' }, { type: 'pause' });
    expect(state).toMatchObject({ cursor: 2, status: 'paused' });
    state = run(state, { type: 'play' });
    expect(state).toMatchObject({ cursor: 2, status: 'playing' });
  });

  it('reproduzir no último passo recomeça do primeiro', () => {
    const end = run(loaded(4), { type: 'last' });
    expect(isFinished(end)).toBe(true);
    expect(run(end, { type: 'play' })).toMatchObject({ cursor: 0, status: 'playing' });
  });

  it('pausar sem estar tocando não muda nada', () => {
    const state = loaded(3);
    expect(run(state, { type: 'pause' })).toBe(state);
  });
});

describe('reiniciar', () => {
  it('volta ao passo 0 e pausa, em qualquer ponto', () => {
    for (const start of [loaded(5, true), run(loaded(5), { type: 'last' })]) {
      expect(run(start, { type: 'restart' })).toMatchObject({ cursor: 0, status: 'paused' });
    }
  });

  it('first faz o mesmo que restart', () => {
    const middle = run(loaded(5), { type: 'seek', index: 3 });
    expect(run(middle, { type: 'first' })).toEqual(run(middle, { type: 'restart' }));
  });
});

describe('limpar', () => {
  it('descarta a execução', () => {
    expect(run(loaded(5, true), { type: 'clear' })).toMatchObject({ stepCount: 0, status: 'idle' });
  });
});

describe('o reducer não altera o estado recebido', () => {
  it('devolve objetos novos', () => {
    const before = loaded(4, true);
    const snapshot = structuredClone(before);
    run(before, { type: 'next' }, { type: 'last' }, { type: 'restart' }, { type: 'tick' });
    expect(before).toEqual(snapshot);
  });
});
