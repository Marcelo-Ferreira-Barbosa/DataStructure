import type { SinglyLinkedListAnchor as Anchor } from '@dss/engine';

/**
 * Pseudocódigo da lista (texto da interface; a Engine só entrega a âncora de cada passo).
 * Regra de autoria (INTERFACE.md §10.5): linhas de até 36 caracteres, sem quebra automática.
 * Várias linhas podem ter a mesma âncora (todas são realçadas); `null` = linha sem passo.
 */
export interface PseudocodeLine {
  readonly text: string;
  readonly anchor: Anchor | null;
}

export interface PseudocodeBlock {
  readonly title: string;
  readonly lines: readonly PseudocodeLine[];
}

const line = (text: string, anchor: Anchor | null): PseudocodeLine => ({ text, anchor });

/** Um bloco por operação; chave = prefixo da âncora (`sll.<operação>`). */
export const pseudocode = {
  insertHead: {
    title: 'inserirInicio(valor)',
    lines: [
      line('inserirInicio(valor)', 'sll.insertHead.entry'),
      line('  novo ← Nó(valor)', 'sll.insertHead.allocate'),
      line('  novo.next ← head', 'sll.insertHead.link-next'),
      line('  head ← novo', 'sll.insertHead.set-head'),
      line('  se tail == null: tail ← novo', 'sll.insertHead.set-tail'),
      line('  tamanho ← tamanho + 1', 'sll.insertHead.done'),
    ],
  },
  insertTail: {
    title: 'inserirFim(valor)',
    lines: [
      line('inserirFim(valor)', 'sll.insertTail.entry'),
      line('  vazia ← (head == null)', 'sll.insertTail.check-empty'),
      line('  novo ← Nó(valor)', 'sll.insertTail.allocate'),
      line('  se vazia: head ← novo', 'sll.insertTail.set-head'),
      line('  senão: tail.next ← novo', 'sll.insertTail.link-tail'),
      line('  tail ← novo', 'sll.insertTail.set-tail'),
      line('  tamanho ← tamanho + 1', 'sll.insertTail.done'),
    ],
  },
  insertAt: {
    title: 'inserirEm(pos, valor)',
    lines: [
      line('inserirEm(pos, valor)', 'sll.insertAt.entry'),
      line('  se pos == 0: inserirInicio()', 'sll.insertAt.check-position'),
      line('  se pos == tamanho: inserirFim()', 'sll.insertAt.check-position'),
      line('  anterior ← head', 'sll.insertAt.walk'),
      line('  repita pos − 1 vezes:', 'sll.insertAt.walk'),
      line('    anterior ← anterior.next', 'sll.insertAt.walk'),
      line('  novo ← Nó(valor)', 'sll.insertAt.allocate'),
      line('  novo.next ← anterior.next', 'sll.insertAt.link-next'),
      line('  anterior.next ← novo', 'sll.insertAt.link-previous'),
      line('  tamanho ← tamanho + 1', 'sll.insertAt.done'),
    ],
  },
  removeHead: {
    title: 'removerInicio()',
    lines: [
      line('removerInicio()', null),
      line('  se head == null: recusa', 'sll.removeHead.check-empty'),
      line('  removido ← head', 'sll.removeHead.read'),
      line('  head ← head.next', 'sll.removeHead.set-head'),
      line('  se head == null: tail ← null', 'sll.removeHead.set-tail'),
      line('  libera removido', 'sll.removeHead.done'),
      line('  tamanho ← tamanho − 1', 'sll.removeHead.done'),
    ],
  },
  removeTail: {
    title: 'removerFim()',
    lines: [
      line('removerFim()', null),
      line('  se head == null: recusa', 'sll.removeTail.check-empty'),
      line('  removerEm(tamanho − 1)', 'sll.removeTail.delegate'),
    ],
  },
  removeAt: {
    title: 'removerEm(pos)',
    lines: [
      line('removerEm(pos)', null),
      line('  se pos ≥ tamanho: recusa', 'sll.removeAt.check-position'),
      line('  se pos == 0: removerInicio()', 'sll.removeAt.check-position'),
      line('  anterior ← head', 'sll.removeAt.walk'),
      line('  repita pos − 1 vezes:', 'sll.removeAt.walk'),
      line('    anterior ← anterior.next', 'sll.removeAt.walk'),
      line('  alvo ← anterior.next', 'sll.removeAt.read-target'),
      line('  anterior.next ← alvo.next', 'sll.removeAt.unlink'),
      line('  se alvo == tail:', 'sll.removeAt.set-tail'),
      line('    tail ← anterior', 'sll.removeAt.set-tail'),
      line('  libera alvo', 'sll.removeAt.done'),
      line('  tamanho ← tamanho − 1', 'sll.removeAt.done'),
    ],
  },
  search: {
    title: 'pesquisar(valor)',
    lines: [
      line('pesquisar(valor)', 'sll.search.entry'),
      line('  atual ← head', 'sll.search.entry'),
      line('  enquanto atual ≠ null:', 'sll.search.compare'),
      line('    se atual.valor == valor:', 'sll.search.compare'),
      line('      devolve a posição', 'sll.search.found'),
      line('    atual ← atual.next', 'sll.search.compare'),
      line('  devolve "ausente"', 'sll.search.not-found'),
    ],
  },
  getAt: {
    title: 'lerEm(pos)',
    lines: [
      line('lerEm(pos)', null),
      line('  se pos ≥ tamanho: recusa', 'sll.getAt.check-position'),
      line('  atual ← head', 'sll.getAt.walk'),
      line('  repita pos vezes:', 'sll.getAt.walk'),
      line('    atual ← atual.next', 'sll.getAt.walk'),
      line('  devolve atual.valor', 'sll.getAt.done'),
    ],
  },
  traverse: {
    title: 'percorrer()',
    lines: [
      line('percorrer()', 'sll.traverse.entry'),
      line('  atual ← head', 'sll.traverse.entry'),
      line('  enquanto atual ≠ null:', 'sll.traverse.visit'),
      line('    visita(atual)', 'sll.traverse.visit'),
      line('    atual ← atual.next', 'sll.traverse.visit'),
      line('  fim do percurso', 'sll.traverse.done'),
    ],
  },
  toArray: {
    title: 'paraArray()',
    lines: [
      line('paraArray()', 'sll.toArray.entry'),
      line('  saida ← []', 'sll.toArray.entry'),
      line('  atual ← head', 'sll.toArray.entry'),
      line('  enquanto atual ≠ null:', 'sll.toArray.visit'),
      line('    saida.adiciona(atual.valor)', 'sll.toArray.visit'),
      line('    atual ← atual.next', 'sll.toArray.visit'),
      line('  devolve saida', 'sll.toArray.done'),
    ],
  },
} as const satisfies Record<string, PseudocodeBlock>;

export type PseudocodeKey = keyof typeof pseudocode;

/**
 * O bloco a mostrar vem da própria âncora do passo (a operação pode delegar a outra, como
 * `removeTail` a `removeAt`); sem âncora, vale a operação executada.
 */
export function pseudocodeFor(
  anchor: string | null,
  operationName: string,
): PseudocodeBlock | null {
  const fromAnchor = anchor?.split('.')[1];
  for (const key of [fromAnchor, operationName]) {
    if (key !== undefined && Object.hasOwn(pseudocode, key))
      return pseudocode[key as PseudocodeKey];
  }
  return null;
}
