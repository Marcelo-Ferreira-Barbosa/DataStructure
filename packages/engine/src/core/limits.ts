/** Fonte única dos limites (RN-002). Valores propostos; Q42 ainda está aberta. */
export const LIMITS = {
  maxElements: 50,
  minValue: -999,
  maxValue: 999,
  maxOperationsPerSimulation: 200,
  maxStepsPerExecution: 10_000,
} as const;
