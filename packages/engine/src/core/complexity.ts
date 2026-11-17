/** Conjunto fechado de notações; n = tamanho da entrada, V = vértices, E = arestas. */
export type Bound =
  | 'O(1)'
  | 'O(log n)'
  | 'O(n)'
  | 'O(n log n)'
  | 'O(n^2)'
  | 'O(V)'
  | 'O(V + E)'
  | 'O(V^2)'
  | 'O((V + E) log V)';

export interface Complexity {
  readonly time: { readonly best: Bound; readonly average: Bound; readonly worst: Bound };
  readonly space: Bound;
  /** Custo amortizado, quando difere do pior caso (ex.: inserção em vetor dinâmico). */
  readonly amortized: Bound | null;
}
