import type { SinglyLinkedListOperation } from '@dss/engine';

type OperationType = SinglyLinkedListOperation['type'];
export type OperationGroup = 'insert' | 'remove' | 'query' | 'walk';

export interface OperationText {
  readonly label: string;
  readonly group: OperationGroup;
}

/** Nome e grupo de cada operação. O tipo mapeado exige todas as operações da lista. */
export const operationTexts: { readonly [K in OperationType]: OperationText } = {
  insertHead: { label: 'Inserir no início', group: 'insert' },
  insertTail: { label: 'Inserir no final', group: 'insert' },
  insertAt: { label: 'Inserir na posição', group: 'insert' },
  removeHead: { label: 'Remover do início', group: 'remove' },
  removeTail: { label: 'Remover do final', group: 'remove' },
  removeAt: { label: 'Remover da posição', group: 'remove' },
  search: { label: 'Pesquisar valor', group: 'query' },
  getAt: { label: 'Ler posição', group: 'query' },
  traverse: { label: 'Percorrer', group: 'walk' },
  toArray: { label: 'Converter em array', group: 'walk' },
};

export const groupLabels: { readonly [G in OperationGroup]: string } = {
  insert: 'Inserir',
  remove: 'Remover',
  query: 'Consultar',
  walk: 'Percorrer',
};

export const groupOrder: readonly OperationGroup[] = ['insert', 'remove', 'query', 'walk'];

/** Rótulo do campo conforme o papel do parâmetro no descritor. */
export const paramLabels: Readonly<Record<'value' | 'position' | 'target', string>> = {
  value: 'Valor',
  position: 'Posição',
  target: 'Valor procurado',
};

export function operationLabel(type: string): string {
  return Object.hasOwn(operationTexts, type) ? operationTexts[type as OperationType].label : type;
}
