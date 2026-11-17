declare const elementIdBrand: unique symbol;

/** Identidade estável de um elemento ao longo de TODOS os passos (RF-018). Número, para JSON enxuto. */
export type ElementId = number & { readonly [elementIdBrand]: true };

export type LabId =
  | 'linear'
  | 'linked-lists'
  | 'trees'
  | 'hash-tables'
  | 'heaps'
  | 'graphs'
  | 'sorting'
  | 'searching';

export type ItemId = string;

/** Único lugar onde um número vira ElementId (geração a partir de `state.nextId`). */
export function elementId(n: number): ElementId {
  return n as ElementId;
}
