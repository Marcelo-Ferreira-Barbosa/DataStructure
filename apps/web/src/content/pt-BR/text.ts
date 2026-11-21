/** Pequenos auxiliares de redação em português, compartilhados pelo catálogo. */

/** "1 nó", "3 nós". */
export function nodes(count: number): string {
  return `${count} ${count === 1 ? 'nó' : 'nós'}`;
}

/** "1 valor", "3 valores". */
export function values(count: number): string {
  return `${count} ${count === 1 ? 'valor' : 'valores'}`;
}
