import type { Step, StructureState } from '@dss/engine';
import type { LabSession } from './session';

/** O passo atual: fonte única de visualização, explicação, pseudocódigo e contadores. */
export function currentStep(session: LabSession): Step | null {
  return session.execution?.steps[session.playback.cursor] ?? null;
}

/** O que desenhar: o passo atual, ou a lista em repouso quando não há execução. */
export function displayedState(session: LabSession): StructureState {
  return currentStep(session)?.state ?? session.structure;
}
