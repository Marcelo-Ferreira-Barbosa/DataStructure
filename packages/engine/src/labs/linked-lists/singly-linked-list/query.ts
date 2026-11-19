import type { ElementId } from '../../../core/ids';
import type { ExecutionResult } from '../../../core/execution';
import type { LinkedListState } from '../../../core/state';
import { nodeAt, nodesInOrder, pointerHighlights } from './list-state';
import {
  element,
  rejectEmpty,
  rejectPosition,
  visitedHighlights,
  visitHighlights,
  walk,
  type ListMessage,
  type Recorder,
  type Rejection,
} from './steps';
import type { SinglyLinkedListAnchor } from './types';

export interface QueryOutcome {
  readonly outcome: 'completed';
  readonly finalState: LinkedListState;
  readonly result: ExecutionResult;
}

const completed = (state: LinkedListState, result: ExecutionResult): QueryOutcome => ({
  outcome: 'completed',
  finalState: state,
  result,
});

/** Como cada operação de percurso completo se descreve. O percurso em si é um só. */
interface FullPass {
  readonly anchors: {
    readonly entry: SinglyLinkedListAnchor;
    readonly visit: SinglyLinkedListAnchor;
    readonly done: SinglyLinkedListAnchor;
  };
  start(size: number): ListMessage;
  visit(value: number, index: number): ListMessage;
  done(size: number): ListMessage;
}

/** Percorre a lista inteira (1 acesso por nó) sem alterá-la e devolve os valores na ordem. */
function fullPass(state: LinkedListState, recorder: Recorder, pass: FullPass): number[] {
  const ordered = nodesInOrder(state);
  recorder.step({
    state,
    highlights: pointerHighlights(state),
    message: pass.start(ordered.length),
    anchor: pass.anchors.entry,
  });

  const values: number[] = [];
  walk(ordered, recorder, ordered.length - 1, (visit) => {
    values.push(visit.node.value);
    recorder.step({
      state,
      highlights: visitHighlights(visit),
      message: pass.visit(visit.node.value, visit.index),
      anchor: pass.anchors.visit,
    });
    return false;
  });

  recorder.step({
    state,
    highlights: visitedHighlights(ordered),
    message: pass.done(values.length),
    anchor: pass.anchors.done,
  });
  return values;
}

/** Converte para array: o resultado é o conteúdo da lista, na ordem. */
export function toArraySteps(state: LinkedListState, recorder: Recorder): QueryOutcome {
  const values = fullPass(state, recorder, {
    anchors: {
      entry: 'sll.toArray.entry',
      visit: 'sll.toArray.visit',
      done: 'sll.toArray.done',
    },
    start: (size) => ({ key: 'sll.toArray.start', params: { size } }),
    visit: (value, index) => ({ key: 'sll.toArray.visit', params: { value, index } }),
    done: (size) => ({ key: 'sll.toArray.done', params: { size } }),
  });
  return completed(state, { type: 'values', values });
}

/** Percorre a lista (a animação do percurso). Não produz resultado: o que importa é o caminho. */
export function traverseSteps(state: LinkedListState, recorder: Recorder): QueryOutcome {
  fullPass(state, recorder, {
    anchors: {
      entry: 'sll.traverse.entry',
      visit: 'sll.traverse.visit',
      done: 'sll.traverse.done',
    },
    start: (size) => ({ key: 'sll.traverse.start', params: { size } }),
    visit: (value, index) => ({ key: 'sll.traverse.visit', params: { value, index } }),
    done: (size) => ({ key: 'sll.traverse.done', params: { size } }),
  });
  return completed(state, { type: 'none' });
}

/**
 * Pesquisa por valor, do início ao fim, parando na PRIMEIRA ocorrência (com repetidos, a
 * posição devolvida é sempre a da primeira). Cada nó visitado custa 1 acesso e 1 comparação.
 * Valor ausente não é erro: o percurso completo termina em `not-found`.
 */
export function searchSteps(
  state: LinkedListState,
  value: number,
  recorder: Recorder,
): QueryOutcome {
  const ordered = nodesInOrder(state);
  recorder.step({
    state,
    highlights: pointerHighlights(state),
    message: { key: 'sll.search.start', params: { value } },
    anchor: 'sll.search.entry',
  });

  let foundAt: { id: ElementId; index: number } | null = null;
  walk(ordered, recorder, ordered.length - 1, (visit) => {
    recorder.compare();
    const equal = visit.node.value === value;
    recorder.step({
      state,
      highlights: visitHighlights(visit),
      message: {
        key: 'sll.search.compare',
        params: { candidate: visit.node.value, value, index: visit.index, equal },
      },
      anchor: 'sll.search.compare',
    });
    if (equal) foundAt = { id: visit.node.id, index: visit.index };
    return equal;
  });

  if (foundAt === null) {
    recorder.step({
      state,
      highlights: visitedHighlights(ordered).map((h) => ({ ...h, role: 'not-found' as const })),
      message: { key: 'sll.search.not-found', params: { value } },
      anchor: 'sll.search.not-found',
    });
    return completed(state, { type: 'not-found' });
  }

  const hit: { id: ElementId; index: number } = foundAt;
  recorder.step({
    state,
    highlights: [...visitedHighlights(ordered.slice(0, hit.index)), element(hit.id, 'found')],
    message: { key: 'sll.search.found', params: { value, index: hit.index } },
    anchor: 'sll.search.found',
  });
  return completed(state, { type: 'found', id: hit.id, index: hit.index });
}

/** Consulta o valor na posição `position`: percorre até lá (posição 0 não percorre nada). */
export function getAtSteps(
  state: LinkedListState,
  position: number,
  recorder: Recorder,
): QueryOutcome | Rejection {
  const ordered = nodesInOrder(state);
  recorder.step({
    state,
    highlights: pointerHighlights(state),
    message: { key: 'sll.getAt.start', params: { position } },
    anchor: 'sll.getAt.check-position',
  });
  if (ordered.length === 0) return rejectEmpty(state, recorder, 'sll.getAt.check-position');
  if (position >= ordered.length) {
    return rejectPosition(state, recorder, position, ordered.length, 'sll.getAt.check-position');
  }

  walk(ordered, recorder, position, (visit) => {
    recorder.step({
      state,
      highlights: visitHighlights(visit),
      message: { key: 'sll.getAt.visit', params: { value: visit.node.value, index: visit.index } },
      anchor: 'sll.getAt.walk',
    });
    return false;
  });

  const target = nodeAt(ordered, position);
  recorder.step({
    state,
    highlights: [...visitedHighlights(ordered.slice(0, position)), element(target.id, 'found')],
    message: { key: 'sll.getAt.done', params: { value: target.value, position } },
    anchor: 'sll.getAt.done',
  });
  return completed(state, { type: 'value', value: target.value });
}
