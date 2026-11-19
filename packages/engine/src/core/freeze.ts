/**
 * Congela em profundidade (objetos, listas e o que houver dentro). Depois disso, qualquer
 * tentativa de alterar o valor lança `TypeError` (módulos ESM são estritos). Idempotente.
 * Só serve a dados simples (JSON): é o caso de estados, passos e destaques.
 */
export function deepFreeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}
