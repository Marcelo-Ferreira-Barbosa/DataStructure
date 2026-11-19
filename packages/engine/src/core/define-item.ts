import type { Execution, OperationAttempt } from './execution';
import type { InitialStateResult, Item, ItemDefinition, ItemDescriptor } from './item';
import type { ItemTypes } from './item-types';
import { LIMITS } from './limits';
import { EngineInvariantError, type InputProblem } from './problems';
import { deepFreeze } from './freeze';
import { inspectState } from './inspect';
import { createRecorder } from './recorder';
import { ENGINE_REVISION } from './revision';

type Parsed =
  { ok: true; operation: Record<string, unknown> } | { ok: false; problems: InputProblem[] };

function parseOperation(descriptor: ItemDescriptor, raw: unknown): Parsed {
  const problem = (
    code: InputProblem['code'],
    path: string,
    meta: InputProblem['meta'] = null,
  ): InputProblem => ({ code, path, meta });
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { ok: false, problems: [problem('INVALID_TYPE', 'operation')] };
  }
  const obj = raw as Record<string, unknown>;
  const spec = descriptor.operations.find((o) => o.type === obj['type']);
  if (obj['type'] === undefined) return { ok: false, problems: [problem('REQUIRED', 'type')] };
  if (spec === undefined) return { ok: false, problems: [problem('NOT_ALLOWED', 'type')] };

  const problems: InputProblem[] = [];
  const allowed = new Set(['type', ...spec.params.map((p) => p.name)]);
  for (const key of Object.keys(obj))
    if (!allowed.has(key)) problems.push(problem('NOT_ALLOWED', key));
  for (const param of spec.params) {
    const v = obj[param.name];
    if (v === undefined) problems.push(problem('REQUIRED', param.name));
    else if (typeof v !== 'number' || !Number.isInteger(v))
      problems.push(problem('INVALID_TYPE', param.name));
    else if (v < param.min || v > param.max)
      problems.push(problem('OUT_OF_RANGE', param.name, { min: param.min, max: param.max }));
  }
  return problems.length > 0 ? { ok: false, problems } : { ok: true, operation: obj };
}

export function defineItem<T extends ItemTypes>(def: ItemDefinition<T>): Item {
  const d = def.descriptor;
  return {
    descriptor: d,

    createInitialState(values): InitialStateResult {
      if (!Array.isArray(values))
        return { ok: false, problems: [{ code: 'INVALID_TYPE', path: 'values', meta: null }] };
      const problems: InputProblem[] = [];
      const numbers: number[] = [];
      if (values.length > LIMITS.maxElements) {
        problems.push({
          code: 'LIMIT_EXCEEDED',
          path: 'values',
          meta: { min: 0, max: LIMITS.maxElements },
        });
      }
      values.forEach((v: unknown, i) => {
        const path = `values[${i}]`;
        if (typeof v !== 'number' || !Number.isInteger(v))
          problems.push({ code: 'INVALID_TYPE', path, meta: null });
        else if (v < LIMITS.minValue || v > LIMITS.maxValue)
          problems.push({
            code: 'OUT_OF_RANGE',
            path,
            meta: { min: LIMITS.minValue, max: LIMITS.maxValue },
          });
        else numbers.push(v);
      });
      return problems.length > 0
        ? { ok: false, problems }
        : { ok: true, state: def.createInitialState(numbers) };
    },

    run(state, operation): OperationAttempt {
      if (state.kind !== d.stateKind)
        throw new EngineInvariantError(`Estado ${state.kind} não pertence ao item ${d.id}`);
      const parsed = parseOperation(d, operation);
      if (!parsed.ok) return { outcome: 'invalid-input', problems: parsed.problems };

      const typedState = state as T['state']; // kind já verificado acima
      const typedOp = parsed.operation as unknown as T['operation']; // forma já validada pelo descritor

      const stateProblems = def.checkOperation?.(typedState, typedOp) ?? [];
      if (stateProblems.length > 0) return { outcome: 'invalid-input', problems: stateProblems };
      const pre = def.checkPrecondition?.(typedState, typedOp) ?? null;
      if (pre !== null) return { outcome: 'precondition-failed', problem: pre };

      const { recorder, steps, counters } = createRecorder<T>();
      const result = def.execute({ state: typedState, operation: typedOp, recorder });
      const finalState = result.outcome === 'completed' ? result.finalState : typedState;
      const complexity = d.operations.find((o) => o.type === typedOp.type)?.complexity;
      if (complexity === undefined || steps().length === 0)
        throw new EngineInvariantError('Execução sem passos ou sem complexidade');

      // A execução entregue é um valor imutável: o array de passos, o resultado e os metadados
      // também ficam congelados (cada passo já vem congelado do registrador).
      const execution: Execution<T> = deepFreeze({
        operationName: typedOp.type,
        operation: typedOp,
        outcome: result.outcome,
        initialState: typedState,
        finalState,
        steps: steps(),
        result: result.outcome === 'completed' ? result.result : { type: 'none' },
        complexity,
        metadata: {
          itemId: d.id,
          labId: d.labId,
          engineRevision: ENGINE_REVISION,
          elementsBefore: inspectState(typedState).elementCount,
          elementsAfter: inspectState(finalState).elementCount,
          stepCount: steps().length,
          rejection: result.outcome === 'rejected' ? result.reason : null,
          counters: counters(),
        },
      });
      // Segundo e último ponto de apagamento: Execution<T> -> Execution (sem genéricos).
      return { outcome: result.outcome, execution: execution as unknown as Execution };
    },
  };
}
