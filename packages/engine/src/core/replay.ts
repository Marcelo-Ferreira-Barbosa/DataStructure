import type { OperationSummary, ReplayResult } from './execution';
import type { Item } from './item';
import { LIMITS } from './limits';

/**
 * Reproduz uma receita salva (dados iniciais + operações) sem guardar passos (ADR-0006).
 * Operações `rejected` são válidas e entram na reprodução; `invalid-input` e
 * `precondition-failed` não deveriam constar de uma receita e a tornam não reproduzível.
 */
export function replay(
  item: Item,
  values: readonly number[],
  operations: readonly unknown[],
): ReplayResult {
  if (operations.length > LIMITS.maxOperationsPerSimulation) {
    return { ok: false, failedAt: null, reason: 'too-many-operations' };
  }
  const created = item.createInitialState(values);
  if (!created.ok) return { ok: false, failedAt: null, reason: 'invalid-initial-data' };

  let state = created.state;
  const summaries: OperationSummary[] = [];
  for (const [index, operation] of operations.entries()) {
    const attempt = item.run(state, operation);
    if (attempt.outcome === 'invalid-input' || attempt.outcome === 'precondition-failed') {
      return { ok: false, failedAt: index, reason: attempt.outcome };
    }
    const { execution } = attempt;
    state = execution.finalState;
    summaries.push({
      operationName: execution.operationName,
      outcome: execution.outcome,
      stepCount: execution.steps.length,
      counters: execution.metadata.counters,
    });
  }
  return { ok: true, finalState: state, summaries };
}
