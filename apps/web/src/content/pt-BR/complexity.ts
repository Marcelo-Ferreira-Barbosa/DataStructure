import type { SinglyLinkedListOperation } from '@dss/engine';

type OperationType = SinglyLinkedListOperation['type'];

/** Quando acontece cada caso (de SINGLY_LINKED_LIST.md §6). A ordem de grandeza vem da Engine. */
export const complexityNotes: { readonly [K in OperationType]: string } = {
  insertHead: 'Sempre poucas gravações de ponteiro, qualquer que seja o tamanho da lista.',
  insertTail: 'Constante porque a lista guarda tail: não precisa percorrer até o final.',
  insertAt:
    'Melhor caso: posição 0 ou final. Pior caso: posição do penúltimo nó (percorre quase tudo).',
  removeHead: 'Sempre poucas gravações de ponteiro, qualquer que seja o tamanho da lista.',
  removeTail:
    'Precisa do penúltimo nó e a lista simples não volta: percorre desde o início. Melhor caso: um só nó.',
  removeAt: 'Melhor caso: posição 0. Pior caso: a última posição (percorre quase tudo).',
  search: 'Melhor caso: está no primeiro nó. Pior caso: está no último ou não está na lista.',
  getAt: 'Melhor caso: posição 0. Pior caso: a última posição.',
  traverse: 'Sempre visita todos os nós.',
  toArray: 'Visita todos os nós e o array de saída ocupa espaço proporcional a n.',
};

export const complexityDisclaimer = 'Isto é teoria: conta passos, não mede tempo.';

export const counterLabels = {
  comparisons: 'Comparações',
  moves: 'Gravações de ponteiro',
  accesses: 'Nós lidos',
} as const;

export function complexityNote(operationName: string): string | null {
  return Object.hasOwn(complexityNotes, operationName)
    ? complexityNotes[operationName as OperationType]
    : null;
}
