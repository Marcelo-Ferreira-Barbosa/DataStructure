import type { Execution } from '../core/execution';
import type { Item, ItemDescriptor, OperationDescriptor } from '../core/item';
import { inspectState } from '../core/inspect';
import { LIMITS } from '../core/limits';
import type { StructureState } from '../core/state';
import { deepClone, deepEqual, deepFreeze } from './deep';

/**
 * Suíte genérica de invariantes (ENGINE.md §14.2). Devolve a lista de violações (vazia = ok), de
 * modo que o mesmo código sirva a qualquer teste sem importar nada externo à Engine.
 * Só é importada por testes: nunca faz parte da API pública.
 */
export function checkExecutionInvariants(
  execution: Execution,
  descriptor: ItemDescriptor,
): readonly string[] {
  const out: string[] = [];
  const { steps } = execution;
  const first = steps[0];
  const last = steps.at(-1);

  if (first === undefined || last === undefined) return ['I-00: execução sem passos'];
  if (!deepEqual(first.state, execution.initialState))
    out.push('I-01: passo 0 difere do estado inicial');
  if (!deepEqual(last.state, execution.finalState))
    out.push('I-02: último passo difere do estado final');
  if (steps.some((s, i) => s.index !== i)) out.push('I-03: índices dos passos não são 0..n-1');
  if (steps.length > LIMITS.maxStepsPerExecution) out.push('I-12: acima do teto de passos');
  if (execution.metadata.stepCount !== steps.length)
    out.push('I-14: stepCount diferente de steps.length');

  steps.forEach((step, i) => {
    const previous = steps[i - 1];
    if (previous !== undefined) {
      const p = previous.counters;
      const c = step.counters;
      if (c.comparisons < p.comparisons || c.moves < p.moves || c.accesses < p.accesses) {
        out.push(`I-04: contadores decrescem no passo ${i}`);
      }
    }
    if (step.anchor !== null && !descriptor.anchors.includes(step.anchor)) {
      out.push(`I-05: âncora não declarada "${step.anchor}" no passo ${i}`);
    }
    if (!descriptor.messageKeys.includes(step.message.key)) {
      out.push(`I-06: mensagem não declarada "${step.message.key}" no passo ${i}`);
    }
    const ids = inspectState(step.state).ids;
    if (new Set(ids).size !== ids.length) out.push(`I-07: ids repetidos no passo ${i}`);
    const reachable = new Set([...ids, ...(previous ? inspectState(previous.state).ids : [])]);
    for (const h of step.highlights) {
      if (h.target.type === 'element' && !reachable.has(h.target.id)) {
        out.push(`I-08: destaque de elemento ${h.target.id} inexistente no passo ${i}`);
      }
    }
    const roundTrip: unknown = JSON.parse(JSON.stringify(step));
    if (!deepEqual(roundTrip, step))
      out.push(`I-09: passo ${i} não sobrevive à ida e volta por JSON`);
  });

  if (execution.outcome === 'rejected') {
    if (!deepEqual(execution.initialState, execution.finalState)) {
      out.push('I-13: operação rejeitada alterou o estado');
    }
    if (execution.metadata.rejection === null) out.push('I-13: rejeição sem motivo nos metadados');
  } else if (execution.metadata.rejection !== null) {
    out.push('I-13: execução concluída com motivo de rejeição');
  }

  const final = inspectState(execution.finalState);
  if (final.elementCount > LIMITS.maxElements)
    out.push('I-15: estado final acima do limite de elementos');
  if (final.values.some((v) => v < LIMITS.minValue || v > LIMITS.maxValue)) {
    out.push('I-15: estado final com valor fora da faixa');
  }
  return out;
}

/**
 * Executa `operation` duas vezes sobre uma cópia congelada do estado e verifica:
 * I-10 (determinismo), I-11 (imutabilidade) e, se houve execução, I-01 a I-15.
 */
export function checkItemInvariants(
  item: Item,
  state: StructureState,
  operation: unknown,
): readonly string[] {
  const frozen = deepFreeze(deepClone(state));
  let first;
  let second;
  try {
    first = item.run(frozen, operation);
    second = item.run(frozen, operation);
  } catch (error) {
    return [`I-11: a operação lançou ou tentou alterar a entrada congelada (${String(error)})`];
  }
  const out: string[] = [];
  if (!deepEqual(first, second)) out.push('I-10: duas execuções da mesma entrada diferem');
  if (first.outcome === 'completed' || first.outcome === 'rejected') {
    out.push(...checkExecutionInvariants(first.execution, item.descriptor));
  }
  return out;
}

/** Operações de amostra geradas do descritor: cada parâmetro no mínimo, em zero (se couber) e no máximo. */
export function sampleOperations(
  operation: OperationDescriptor,
): readonly Record<string, unknown>[] {
  if (operation.params.length === 0) return [{ type: operation.type }];
  const pick = (min: number, max: number): number[] => [
    ...new Set([min, Math.min(Math.max(0, min), max), max]),
  ];
  const combos = operation.params.reduce<Record<string, unknown>[]>(
    (acc, param) =>
      acc.flatMap((partial) =>
        pick(param.min, param.max).map((value) => ({ ...partial, [param.name]: value })),
      ),
    [{ type: operation.type }],
  );
  return combos;
}
