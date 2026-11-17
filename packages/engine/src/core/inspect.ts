import type { StructureState } from './state';

export interface StateInspection {
  /** Quantidade de elementos "de dados" (vértices, nós, entradas, elementos). */
  readonly elementCount: number;
  /** Todos os ids presentes no estado (inclui arestas de grafos). */
  readonly ids: readonly number[];
  /** Todos os valores numéricos de dados do estado. */
  readonly values: readonly number[];
}

/** Visão uniforme de qualquer estado; `switch` exaustivo: um `kind` novo obriga a atualizar aqui. */
export function inspectState(state: StructureState): StateInspection {
  switch (state.kind) {
    case 'sequence': {
      const all = [...state.elements, ...state.auxiliary.flatMap((a) => a.elements)];
      return {
        elementCount: state.elements.length,
        ids: all.map((e) => e.id),
        values: all.map((e) => e.value),
      };
    }
    case 'stack':
    case 'queue':
    case 'heap':
      return {
        elementCount: state.elements.length,
        ids: state.elements.map((e) => e.id),
        values: state.elements.map((e) => e.value),
      };
    case 'linked-list':
    case 'binary-tree':
      return {
        elementCount: state.nodes.length,
        ids: state.nodes.map((n) => n.id),
        values: state.nodes.map((n) => n.value),
      };
    case 'hash-table': {
      const entries = state.buckets.flatMap((b) => b.entries);
      return {
        elementCount: entries.length,
        ids: entries.map((e) => e.id),
        values: entries.flatMap((e) => [e.key, e.value]),
      };
    }
    case 'graph':
      return {
        elementCount: state.vertices.length,
        ids: [...state.vertices.map((v) => v.id), ...state.edges.map((e) => e.id)],
        values: state.edges.flatMap((e) => (e.weight === null ? [] : [e.weight])),
      };
  }
}
