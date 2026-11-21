import { getItem, type Item, type LinkedListState, type Step } from '@dss/engine';
import { describe, expect, it } from 'vitest';
import { describeList, edgeRoles, nodeRoles } from './describe';
import { chainOf, GEOMETRY, layoutList } from './layout';
import { dominantRole, roleStyles } from './roles';

const item = getItem('singly-linked-list') as Item;

function stateOf(values: number[]): LinkedListState {
  const created = item.createInitialState(values);
  if (!created.ok) throw new Error('lista inválida');
  return created.state as LinkedListState;
}

function stepsOf(values: number[], operation: unknown): readonly Step[] {
  const attempt = item.run(stateOf(values), operation);
  if (attempt.outcome !== 'completed' && attempt.outcome !== 'rejected')
    throw new Error(attempt.outcome);
  return attempt.execution.steps;
}

/** Pontos de um caminho SVG com comandos M, L, H e V (os únicos que o layout gera). */
function pathPoints(path: string): { x: number | null; y: number | null }[] {
  return [...path.matchAll(/([MLHV])\s*(-?\d+(?:\.\d+)?)(?:\s+(-?\d+(?:\.\d+)?))?/g)].map((m) => {
    const a = Number(m[2]);
    switch (m[1]) {
      case 'H':
        return { x: a, y: null };
      case 'V':
        return { x: null, y: a };
      default:
        return { x: a, y: Number(m[3]) };
    }
  });
}

const listState = (step: Step | undefined): LinkedListState => step?.state as LinkedListState;

describe('chainOf', () => {
  it('segue head → next na ordem da lista', () => {
    expect(chainOf(stateOf([4, 8, 15])).map((n) => n.value)).toEqual([4, 8, 15]);
  });

  it('lista vazia não tem cadeia', () => {
    expect(chainOf(stateOf([]))).toEqual([]);
  });

  it('não entra em laço infinito se o estado estiver (indevidamente) em ciclo', () => {
    const base = stateOf([1, 2]);
    const cyclic: LinkedListState = {
      ...base,
      nodes: base.nodes.map((n, i) => (i === 1 ? { ...n, next: base.nodes[0]?.id ?? null } : n)),
    };
    expect(chainOf(cyclic)).toHaveLength(2);
  });

  it('nó recém-criado, ainda solto, NÃO está na cadeia', () => {
    const steps = stepsOf([4, 8], { type: 'insertHead', value: 1 });
    const allocated = listState(steps[1]);
    expect(allocated.nodes).toHaveLength(3);
    expect(chainOf(allocated).map((n) => n.value)).toEqual([4, 8]);
  });
});

describe('layoutList', () => {
  it('coloca a cadeia em ordem, na mesma linha quando cabe', () => {
    const layout = layoutList(stateOf([4, 8, 15]), 800);
    const chain = layout.nodes.filter((n) => n.zone === 'chain');
    expect(chain.map((n) => n.node.value)).toEqual([4, 8, 15]);
    expect(new Set(chain.map((n) => n.y)).size).toBe(1);
    expect(chain.map((n) => n.x)).toEqual([...chain.map((n) => n.x)].sort((a, b) => a - b));
    expect(chain.map((n) => n.position)).toEqual([0, 1, 2]);
  });

  it('a caixa null fecha a cadeia e há uma seta de cada nó ao próximo espaço', () => {
    const layout = layoutList(stateOf([4, 8, 15]), 800);
    expect(layout.edges.map((e) => e.to)).toEqual([
      layout.nodes[1]?.node.id,
      layout.nodes[2]?.node.id,
      'terminal',
    ]);
    const last = layout.nodes[2];
    expect(layout.terminal.x).toBeGreaterThan((last?.x ?? 0) + GEOMETRY.nodeW);
  });

  it('lista vazia: só a caixa null, sem nós nem setas', () => {
    const layout = layoutList(stateOf([]), 800);
    expect(layout.nodes).toEqual([]);
    expect(layout.edges).toEqual([]);
    expect(layout.trayLabel).toBeNull();
    expect(layout.terminal.x).toBe(GEOMETRY.margin);
  });

  it('nó solto vai para a faixa de nós soltos, abaixo da cadeia, com sua seta', () => {
    const steps = stepsOf([4, 8], { type: 'insertHead', value: 1 });
    const layout = layoutList(listState(steps[2]), 800);
    const loose = layout.nodes.find((n) => n.zone === 'tray');
    const chainBottom = Math.max(...layout.nodes.filter((n) => n.zone === 'chain').map((n) => n.y));
    expect(loose?.node.value).toBe(1);
    expect(loose?.y).toBeGreaterThan(chainBottom + GEOMETRY.nodeH);
    expect(layout.trayLabel).not.toBeNull();
    expect(layout.edges.some((e) => e.from === loose?.node.id)).toBe(true);
  });

  it('ao ser ligado (head atualizado), o nó entra na cadeia e a faixa some', () => {
    const steps = stepsOf([4, 8], { type: 'insertHead', value: 1 });
    const done = layoutList(listState(steps[steps.length - 1]), 800);
    expect(done.trayLabel).toBeNull();
    expect(done.nodes.filter((n) => n.zone === 'chain').map((n) => n.node.value)).toEqual([
      1, 4, 8,
    ]);
  });

  it('nó removido fica solto antes de ser liberado', () => {
    const steps = stepsOf([4, 8, 15], { type: 'removeAt', position: 1 });
    const unlinked = steps.find((s) => s.anchor === 'sll.removeAt.unlink');
    const layout = layoutList(listState(unlinked), 800);
    expect(layout.nodes.find((n) => n.zone === 'tray')?.node.value).toBe(8);
  });

  it('largura estreita quebra em linhas e cada linha cabe na largura', () => {
    const state = stateOf(Array.from({ length: 12 }, (_, i) => i));
    const layout = layoutList(state, 320);
    expect(layout.perRow).toBeGreaterThanOrEqual(1);
    const rows = new Set(layout.nodes.map((n) => n.y));
    expect(rows.size).toBeGreaterThan(1);
    for (const n of layout.nodes) {
      expect(n.x).toBeGreaterThanOrEqual(GEOMETRY.margin);
      expect(n.x + GEOMETRY.nodeW).toBeLessThanOrEqual(layout.width);
    }
  });

  it('nenhuma seta sai do desenho, em nenhuma largura (rolagem horizontal nunca é preciso)', () => {
    for (const width of [160, 320, 390, 768, 1200]) {
      const layout = layoutList(stateOf(Array.from({ length: 20 }, (_, i) => i)), width);
      for (const edge of layout.edges) {
        for (const { x, y } of pathPoints(edge.path)) {
          if (x !== null) {
            expect(x).toBeGreaterThanOrEqual(0);
            expect(x).toBeLessThanOrEqual(layout.width);
          }
          if (y !== null) {
            expect(y).toBeGreaterThanOrEqual(0);
            expect(y).toBeLessThanOrEqual(layout.height);
          }
        }
      }
      expect(layout.width).toBeGreaterThanOrEqual(GEOMETRY.nodeW + 2 * GEOMETRY.margin);
    }
  });

  it('com largura estreita há setas que quebram de linha (passam pela margem)', () => {
    const layout = layoutList(stateOf(Array.from({ length: 9 }, (_, i) => i)), 320);
    expect(layout.edges.some((e) => e.path.includes(' V '))).toBe(true);
  });

  it('50 nós (o limite) cabem sem sobrepor: posições distintas', () => {
    const layout = layoutList(stateOf(Array.from({ length: 50 }, (_, i) => i)), 390);
    const positions = new Set(layout.nodes.map((n) => `${n.x},${n.y}`));
    expect(positions.size).toBe(50);
    expect(layout.height).toBeGreaterThan(0);
  });

  it('é determinística: mesma entrada, mesma saída', () => {
    const state = stateOf([4, 8, 15]);
    expect(layoutList(state, 500)).toEqual(layoutList(state, 500));
  });
});

describe('descrição em texto', () => {
  it('descreve a lista, início e fim', () => {
    const text = describeList(stateOf([4, 8, 15]), []);
    expect(text).toContain('Lista com 3 nós: 4, 8, 15.');
    expect(text).toContain('Início (head): 4.');
    expect(text).toContain('Fim (tail): 15.');
  });

  it('lista vazia e singular', () => {
    expect(describeList(stateOf([]), [])).toContain('Lista vazia');
    expect(describeList(stateOf([7]), [])).toContain('Lista com 1 nó: 7.');
  });

  it('cita nós soltos e os papéis dos destaques do passo', () => {
    const steps = stepsOf([4, 8], { type: 'insertHead', value: 1 });
    const step = steps[1];
    const text = describeList(listState(step), step?.highlights ?? []);
    expect(text).toContain('Fora da lista: 1.');
    expect(text).toContain('Nó 1: novo.');
  });
});

describe('papéis de destaque', () => {
  it('agrupa por nó e por aresta a partir dos destaques reais', () => {
    const steps = stepsOf([4, 8, 15], { type: 'removeAt', position: 1 });
    const unlink = steps.find((s) => s.anchor === 'sll.removeAt.unlink');
    const roles = nodeRoles(unlink?.highlights ?? []);
    expect([...roles.values()].flat()).toEqual(expect.arrayContaining(['previous', 'removed']));
    const insertEdges = edgeRoles(
      stepsOf([4], { type: 'insertHead', value: 1 })[2]?.highlights ?? [],
    );
    expect([...insertEdges.values()].flat()).toContain('inserted');
  });

  it('todo papel emitido pela lista tem marcador de texto (cor não é o único sinal)', () => {
    const used = [
      'removed',
      'found',
      'not-found',
      'inserted',
      'current',
      'previous',
      'visited',
    ] as const;
    for (const role of used) expect(roleStyles[role].label).not.toBeNull();
  });

  it('o papel dominante define a borda: remoção vence visita', () => {
    expect(dominantRole(['visited', 'removed'])).toBe('removed');
    expect(dominantRole([])).toBeNull();
  });
});
