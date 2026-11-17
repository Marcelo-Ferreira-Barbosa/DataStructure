import { LIMITS } from './limits';
import { EngineInvariantError } from './problems';
import type { ItemTypes } from './item-types';
import type { StepRecorder } from './item';
import type { Counters, Step } from './step';

/** Versão mínima, só para validar os contratos no esboço. */
export function createRecorder<T extends ItemTypes>(): {
  recorder: StepRecorder<T>;
  steps: () => readonly Step<T>[];
  counters: () => Counters;
} {
  let counters: Counters = { comparisons: 0, moves: 0, accesses: 0 };
  const steps: Step<T>[] = [];
  const recorder: StepRecorder<T> = {
    step(frame) {
      if (steps.length >= LIMITS.maxStepsPerExecution) {
        throw new EngineInvariantError('Teto de passos excedido');
      }
      steps.push({
        index: steps.length,
        state: frame.state,
        highlights: frame.highlights ?? [],
        message: frame.message,
        anchor: frame.anchor,
        counters,
      });
    },
    compare: (n = 1) => void (counters = { ...counters, comparisons: counters.comparisons + n }),
    move: (n = 1) => void (counters = { ...counters, moves: counters.moves + n }),
    access: (n = 1) => void (counters = { ...counters, accesses: counters.accesses + n }),
  };
  return { recorder, steps: () => steps, counters: () => counters };
}
