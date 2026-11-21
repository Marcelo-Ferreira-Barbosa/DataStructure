import { getItem, type Item, type LinkedListState } from '@dss/engine';
import { describe, expect, it } from 'vitest';
import { isFinished, playbackReducer } from './playback';
import { currentStep, displayedState } from './selectors';
import { createList, emptySession, runOperation, type LabSession } from './session';

const item = getItem('singly-linked-list') as Item;

function sessionOf(values: number[]): LabSession {
  const created = item.createInitialState(values);
  if (!created.ok) throw new Error('lista de teste inválida');
  return emptySession(created.state);
}

const asList = (state: unknown): LinkedListState => state as LinkedListState;
const valuesOf = (state: unknown): number[] => {
  const list = asList(state);
  const byId = new Map(list.nodes.map((n) => [n.id, n]));
  const out: number[] = [];
  for (let n = list.head === null ? undefined : byId.get(list.head); n;) {
    out.push(n.value);
    n = n.next === null ? undefined : byId.get(n.next);
  }
  return out;
};

describe('executar operações (resultados reais da Engine)', () => {
  it('inserir: a lista em repouso passa a ser o estado final da Engine', () => {
    const next = runOperation(item, sessionOf([4, 8, 15]), { type: 'insertHead', value: 1 }, false);
    expect(next.execution?.outcome).toBe('completed');
    expect(valuesOf(next.structure)).toEqual([1, 4, 8, 15]);
    expect(next.structure).toBe(next.execution?.finalState);
    expect(next.feedback).toBeNull();
  });

  it('remover: devolve o valor removido e encolhe a lista', () => {
    const next = runOperation(
      item,
      sessionOf([4, 8, 15]),
      { type: 'removeAt', position: 1 },
      false,
    );
    expect(next.execution?.result).toEqual({ type: 'value', value: 8 });
    expect(valuesOf(next.structure)).toEqual([4, 15]);
  });

  it('pesquisar: acha e não altera a lista', () => {
    const base = sessionOf([4, 8, 15]);
    const hit = runOperation(item, base, { type: 'search', value: 8 }, false);
    expect(hit.execution?.result).toMatchObject({ type: 'found', index: 1 });
    expect(valuesOf(hit.structure)).toEqual([4, 8, 15]);
    const miss = runOperation(item, base, { type: 'search', value: 99 }, false);
    expect(miss.execution?.result).toEqual({ type: 'not-found' });
    expect(miss.execution?.outcome).toBe('completed');
  });

  it('os passos vêm da Engine: o primeiro tem a lista de antes e o último, a de depois', () => {
    const base = sessionOf([4, 8, 15]);
    const next = runOperation(item, base, { type: 'insertTail', value: 23 }, false);
    const steps = next.execution?.steps ?? [];
    expect(valuesOf(steps[0]?.state)).toEqual([4, 8, 15]);
    expect(valuesOf(steps[steps.length - 1]?.state)).toEqual([4, 8, 15, 23]);
  });
});

describe('recusa e entrada inválida', () => {
  it('operação recusada gera execução, entra no histórico e deixa a lista intacta', () => {
    const base = sessionOf([]);
    const next = runOperation(item, base, { type: 'removeHead' }, false);
    expect(next.execution?.outcome).toBe('rejected');
    expect(next.execution?.metadata.rejection).toBe('EMPTY_STRUCTURE');
    expect(next.history).toHaveLength(1);
    expect(valuesOf(next.structure)).toEqual([]);
  });

  it('posição inexistente é recusada, sem alterar a lista', () => {
    const next = runOperation(item, sessionOf([4]), { type: 'removeAt', position: 9 }, false);
    expect(next.execution?.metadata.rejection).toBe('POSITION_OUT_OF_RANGE');
    expect(valuesOf(next.structure)).toEqual([4]);
  });

  it('entrada inválida NÃO gera execução nem histórico, e a sessão anterior fica como estava', () => {
    const played = runOperation(item, sessionOf([4, 8]), { type: 'insertHead', value: 1 }, true);
    expect(played.execution).not.toBeNull();
    const next = runOperation(item, played, { type: 'insertHead', value: 5000 }, true);
    expect(next.feedback).toMatchObject({ source: 'operation' });
    expect(next.history).toBe(played.history);
    expect(next.execution).toBe(played.execution);
    expect(next.playback).toBe(played.playback);
    expect(next.structure).toBe(played.structure);
  });

  it.each([
    [{ type: 'insertHead' }, 'REQUIRED'],
    [{ type: 'insertHead', value: 'abc' }, 'INVALID_TYPE'],
    [{ type: 'insertHead', value: 1.5 }, 'INVALID_TYPE'],
    [{ type: 'insertHead', value: 1000 }, 'OUT_OF_RANGE'],
    [{ type: 'removeAt', position: -1 }, 'OUT_OF_RANGE'],
  ])('a Engine, e não a interface, decide: %j → %s', (operation, code) => {
    const next = runOperation(item, sessionOf([4]), operation, false);
    expect(next.feedback).toMatchObject({
      source: 'operation',
      problems: [expect.objectContaining({ code })],
    });
    expect(next.execution).toBeNull();
  });

  it('lista cheia: inserir de novo vira entrada inválida (limite)', () => {
    const full = sessionOf(Array.from({ length: 50 }, (_, i) => i));
    const next = runOperation(item, full, { type: 'insertTail', value: 1 }, false);
    expect(next.feedback).toMatchObject({
      problems: [expect.objectContaining({ code: 'LIMIT_EXCEEDED' })],
    });
  });

  it('falha inesperada da Engine vira aviso interno e não derruba a sessão', () => {
    const broken = {
      descriptor: item.descriptor,
      createInitialState: item.createInitialState.bind(item),
      run: () => {
        throw new Error('invariante violada');
      },
    } as unknown as Item;
    const base = sessionOf([4]);
    const next = runOperation(broken, base, { type: 'traverse' }, false);
    expect(next.feedback).toEqual({ source: 'internal', message: 'invariante violada' });
    expect(next.structure).toBe(base.structure);
    expect(next.history).toBe(base.history);
  });
});

describe('preservação dos estados anteriores', () => {
  it('o histórico guarda cada execução com todos os passos, sem alterá-los', () => {
    let session = sessionOf([4, 8, 15]);
    session = runOperation(item, session, { type: 'insertHead', value: 1 }, false);
    const first = session.history[0]?.execution;
    const firstSnapshot = JSON.stringify(first);
    session = runOperation(item, session, { type: 'removeTail' }, false);
    session = runOperation(item, session, { type: 'search', value: 8 }, false);
    expect(session.history.map((h) => h.id)).toEqual([1, 2, 3]);
    expect(session.history[0]?.execution).toBe(first);
    expect(JSON.stringify(session.history[0]?.execution)).toBe(firstSnapshot);
  });

  it('cada operação parte do estado final da anterior (encadeamento real)', () => {
    let session = sessionOf([]);
    for (const value of [1, 2, 3]) {
      session = runOperation(item, session, { type: 'insertTail', value }, false);
    }
    session = runOperation(item, session, { type: 'removeHead' }, false);
    expect(valuesOf(session.structure)).toEqual([2, 3]);
    expect(session.history).toHaveLength(4);
  });

  it('executar no meio de uma reprodução conclui a anterior: ela já está no histórico', () => {
    let session = sessionOf([4, 8, 15]);
    session = runOperation(item, session, { type: 'insertHead', value: 1 }, true);
    expect(session.playback.status).toBe('playing');
    const interrupted = session.execution;
    session = runOperation(item, session, { type: 'insertTail', value: 99 }, true);
    expect(session.history[0]?.execution).toBe(interrupted);
    expect(valuesOf(session.structure)).toEqual([1, 4, 8, 15, 99]);
    expect(session.playback.cursor).toBe(0);
  });

  it('os estados dos passos estão congelados: a interface não consegue corrompê-los', () => {
    const next = runOperation(item, sessionOf([4, 8]), { type: 'insertHead', value: 1 }, false);
    const state = next.execution?.steps[1]?.state as unknown as { nodes: { value: number }[] };
    expect(() => {
      (state.nodes[0] as { value: number }).value = 777;
    }).toThrow(TypeError);
  });
});

describe('sincronização entre Engine e exibição', () => {
  it('em cada cursor, o que se desenha é exatamente o estado do passo da Engine', () => {
    const run = runOperation(
      item,
      sessionOf([4, 8, 15]),
      { type: 'insertAt', position: 2, value: 9 },
      false,
    );
    const count = run.execution?.steps.length ?? 0;
    expect(count).toBeGreaterThan(3);
    for (let i = 0; i < count; i++) {
      const at: LabSession = {
        ...run,
        playback: playbackReducer(run.playback, { type: 'seek', index: i }),
      };
      expect(displayedState(at)).toBe(run.execution?.steps[i]?.state);
      expect(currentStep(at)).toBe(run.execution?.steps[i]);
    }
  });

  it('no último passo, o que se desenha coincide com a lista em repouso', () => {
    const run = runOperation(item, sessionOf([4, 8, 15]), { type: 'removeAt', position: 0 }, false);
    const end: LabSession = { ...run, playback: playbackReducer(run.playback, { type: 'last' }) };
    expect(isFinished(end.playback)).toBe(true);
    expect(valuesOf(displayedState(end))).toEqual(valuesOf(end.structure));
  });

  it('antes de qualquer operação, desenha a lista em repouso', () => {
    const base = sessionOf([4, 8]);
    expect(currentStep(base)).toBeNull();
    expect(displayedState(base)).toBe(base.structure);
  });
});

describe('criar lista', () => {
  it('apaga histórico e execução e preserva a velocidade', () => {
    let session = runOperation(item, sessionOf([4]), { type: 'insertHead', value: 1 }, false);
    session = {
      ...session,
      playback: playbackReducer(session.playback, { type: 'setSpeed', speed: 2 }),
    };
    const next = createList(item, session, [7, 8, 9]);
    expect(next.history).toEqual([]);
    expect(next.execution).toBeNull();
    expect(next.playback).toMatchObject({ status: 'idle', stepCount: 0, speed: 2 });
    expect(valuesOf(next.structure)).toEqual([7, 8, 9]);
  });

  it('lista inválida mantém a sessão intacta e explica o problema por posição', () => {
    const session = runOperation(item, sessionOf([4]), { type: 'insertHead', value: 1 }, false);
    const next = createList(item, session, [1, 2000, 3]);
    expect(next.history).toBe(session.history);
    expect(next.structure).toBe(session.structure);
    expect(next.feedback).toMatchObject({
      source: 'list',
      problems: [expect.objectContaining({ code: 'OUT_OF_RANGE', path: 'values[1]' })],
    });
  });

  it('mais de 50 valores é recusado pela Engine', () => {
    const next = createList(
      item,
      sessionOf([]),
      Array.from({ length: 51 }, () => 1),
    );
    expect(next.feedback).toMatchObject({ source: 'list' });
  });
});
