import { getItem, type Execution, type InputProblem, type Item } from '@dss/engine';
import { describe, expect, it } from 'vitest';
import { complexityNote, complexityNotes } from './complexity';
import { messages, renderMessage } from './messages';
import { operationLabel, operationTexts, paramLabels } from './operations';
import { describeProblem, problemField, problemItem, rejectionTitles } from './problems';
import { pseudocode, pseudocodeFor } from './pseudocode';
import { describeResult } from './results';

const item = getItem('singly-linked-list') as Item;
const { descriptor } = item;

/** Todas as operações sobre várias listas, inclusive vazia, recusas e posições além do fim. */
function allExecutions(): Execution[] {
  const executions: Execution[] = [];
  for (const values of [[], [7], [4, 8], [4, 8, 15], [1, 2, 3, 4, 5, 6]]) {
    const created = item.createInitialState(values);
    if (!created.ok) throw new Error('lista inválida');
    const operations: unknown[] = [
      { type: 'removeHead' },
      { type: 'removeTail' },
      { type: 'traverse' },
      { type: 'toArray' },
      ...[1, 8, 99].flatMap((value) => [
        { type: 'insertHead', value },
        { type: 'insertTail', value },
        { type: 'search', value },
      ]),
      ...[0, 1, 2, 3, 6, 40].flatMap((position) => [
        { type: 'insertAt', position, value: 5 },
        { type: 'removeAt', position },
        { type: 'getAt', position },
      ]),
    ];
    for (const operation of operations) {
      const attempt = item.run(created.state, operation);
      if (attempt.outcome === 'completed' || attempt.outcome === 'rejected') {
        executions.push(attempt.execution);
      }
    }
  }
  return executions;
}

describe('catálogo de mensagens', () => {
  it('tem texto para TODA chave da Engine, e só para elas', () => {
    expect(Object.keys(messages).sort()).toEqual([...descriptor.messageKeys].sort());
  });

  it('toda mensagem de execuções reais vira frase completa (sem chave crua, undefined ou NaN)', () => {
    const executions = allExecutions();
    expect(executions.length).toBeGreaterThan(150);
    const seen = new Set<string>();
    for (const execution of executions) {
      for (const step of execution.steps) {
        const text = renderMessage(step.message);
        seen.add(step.message.key);
        expect(text).not.toBe(step.message.key);
        expect(text).not.toMatch(/undefined|NaN|\[object/);
        expect(text.trim().length).toBeGreaterThan(5);
        expect(text.endsWith('.')).toBe(true);
      }
    }
    // As execuções de teste exercitam quase todo o catálogo; o que faltar fica explícito.
    const unexercised = descriptor.messageKeys.filter((key) => !seen.has(key));
    expect(unexercised).toEqual([]);
  });

  it('cita os valores reais da execução', () => {
    expect(renderMessage({ key: 'sll.insertHead.start', params: { value: 42 } })).toContain('42');
    expect(
      renderMessage({
        key: 'sll.search.compare',
        params: { candidate: 4, value: 8, index: 0, equal: false },
      }),
    ).toMatch(/4.*diferente.*8/);
  });

  it('usa singular e plural corretos', () => {
    expect(renderMessage({ key: 'sll.insertHead.done', params: { value: 1, size: 1 } })).toContain(
      '1 nó.',
    );
    expect(renderMessage({ key: 'sll.insertHead.done', params: { value: 1, size: 2 } })).toContain(
      '2 nós.',
    );
  });

  it('uma chave desconhecida aparece como a própria chave (defeito visível, não silêncio)', () => {
    expect(renderMessage({ key: 'sll.nao.existe', params: {} })).toBe('sll.nao.existe');
  });
});

describe('pseudocódigo', () => {
  const lines = Object.values(pseudocode).flatMap((block) => block.lines);

  it('cobre TODA âncora da Engine, e só elas', () => {
    const used = new Set(lines.flatMap((l) => (l.anchor === null ? [] : [l.anchor])));
    expect([...used].sort()).toEqual([...descriptor.anchors].sort());
  });

  it('cada linha de um bloco usa âncoras da própria operação', () => {
    for (const [key, block] of Object.entries(pseudocode)) {
      for (const line of block.lines) {
        if (line.anchor !== null) expect(line.anchor.split('.')[1]).toBe(key);
      }
    }
  });

  it('linhas curtas (≤ 36 caracteres), para caber sem quebrar', () => {
    for (const line of lines) expect(line.text.length).toBeLessThanOrEqual(36);
  });

  it('o bloco exibido segue a âncora do passo, mesmo quando a operação delega', () => {
    expect(pseudocodeFor('sll.removeAt.walk', 'removeTail')?.title).toBe('removerEm(pos)');
    expect(pseudocodeFor(null, 'search')?.title).toBe('pesquisar(valor)');
    expect(pseudocodeFor(null, 'desconhecida')).toBeNull();
  });

  it('todo passo real aponta para uma linha existente do bloco exibido', () => {
    for (const execution of allExecutions()) {
      for (const step of execution.steps) {
        const block = pseudocodeFor(step.anchor, execution.operationName);
        expect(block).not.toBeNull();
        expect(block?.lines.some((l) => l.anchor === step.anchor)).toBe(true);
      }
    }
  });
});

describe('operações e complexidade', () => {
  it('têm nome para toda operação do descritor, e só para elas', () => {
    const types = descriptor.operations.map((op) => op.type).sort();
    expect(Object.keys(operationTexts).sort()).toEqual(types);
    expect(Object.keys(complexityNotes).sort()).toEqual(types);
    for (const type of types) {
      expect(operationLabel(type)).not.toBe(type);
      expect(complexityNote(type)).not.toBeNull();
    }
  });

  it('todo papel de parâmetro do descritor tem rótulo', () => {
    for (const op of descriptor.operations) {
      for (const param of op.params) expect(paramLabels[param.role]).toBeTruthy();
    }
  });
});

describe('problemas e recusas', () => {
  const meta = { min: -999, max: 999 };
  const make = (code: InputProblem['code'], m: InputProblem['meta'] = meta): InputProblem => ({
    code,
    path: 'value',
    meta: m,
  });

  it('descreve cada código com os limites vindos do próprio problema', () => {
    expect(describeProblem(make('OUT_OF_RANGE'))).toBe('Use um número de -999 a 999.');
    expect(describeProblem(make('LIMIT_EXCEEDED', { min: 0, max: 50 }))).toContain('50');
    for (const code of ['REQUIRED', 'INVALID_TYPE', 'NOT_ALLOWED'] as const) {
      expect(describeProblem(make(code, null)).length).toBeGreaterThan(5);
    }
    expect(describeProblem(make('OUT_OF_RANGE', null))).toContain('fora');
  });

  it('o problema real da Engine diz o intervalo certo', () => {
    const created = item.createInitialState([1, 5000]);
    expect(created.ok).toBe(false);
    if (!created.ok) {
      const [problem] = created.problems;
      expect(problem && describeProblem(problem)).toBe('Use um número de -999 a 999.');
      expect(problem && problemField(problem)).toBe('values');
      expect(problem && problemItem(problem)).toBe(2);
    }
  });

  it('campo de operação não tem índice', () => {
    expect(problemField({ code: 'REQUIRED', path: 'position', meta: null })).toBe('position');
    expect(problemItem({ code: 'REQUIRED', path: 'position', meta: null })).toBeNull();
  });

  it('toda razão de recusa tem título', () => {
    expect(Object.keys(rejectionTitles).sort()).toEqual(
      ['EMPTY_STRUCTURE', 'POSITION_OUT_OF_RANGE', 'VALUE_NOT_FOUND'].sort(),
    );
  });
});

describe('resultado', () => {
  const run = (values: number[], operation: unknown): Execution => {
    const created = item.createInitialState(values);
    if (!created.ok) throw new Error('lista inválida');
    const attempt = item.run(created.state, operation);
    if (attempt.outcome !== 'completed') throw new Error(attempt.outcome);
    return attempt.execution;
  };

  it('descreve cada tipo de resultado real da Engine', () => {
    expect(describeResult(run([4], { type: 'insertHead', value: 1 }))).toBe(
      'Pronto: a lista agora tem 2 nós.',
    );
    expect(describeResult(run([4, 8], { type: 'removeHead' }))).toBe('Valor removido: 4.');
    expect(describeResult(run([4, 8], { type: 'getAt', position: 1 }))).toBe('Valor lido: 8.');
    expect(describeResult(run([4, 8], { type: 'search', value: 8 }))).toBe(
      'Encontrado: 8 está na posição 1.',
    );
    expect(describeResult(run([4, 8], { type: 'search', value: 9 }))).toBe(
      '9 não está na lista (percorreu 2 nós).',
    );
    expect(describeResult(run([4, 8], { type: 'toArray' }))).toBe('Array: [4, 8].');
  });
});
