import type { InputProblem, RejectionReason } from '@dss/engine';

/** Texto de cada problema de entrada; os limites vêm do próprio problema (`meta`). */
export function describeProblem(problem: InputProblem): string {
  switch (problem.code) {
    case 'REQUIRED':
      return 'Informe um número.';
    case 'INVALID_TYPE':
      return 'Use um número inteiro (sem casas decimais nem letras).';
    case 'OUT_OF_RANGE':
      return problem.meta === null
        ? 'Número fora do intervalo permitido.'
        : `Use um número de ${problem.meta.min} a ${problem.meta.max}.`;
    case 'NOT_ALLOWED':
      return 'Este valor não é permitido.';
    case 'LIMIT_EXCEEDED':
      return problem.meta === null
        ? 'Limite de elementos excedido.'
        : `A lista já está no limite de ${problem.meta.max} nós.`;
  }
}

/** Indica a qual campo o problema se refere: `value`, `position`, `values[2]` → `values`. */
export function problemField(problem: InputProblem): string {
  return problem.path.replace(/\[\d+\]$/, '');
}

/** Posição (a partir de 1) do item com problema em `values[i]`, ou `null`. */
export function problemItem(problem: InputProblem): number | null {
  const match = /\[(\d+)\]$/.exec(problem.path);
  return match?.[1] === undefined ? null : Number(match[1]) + 1;
}

export const rejectionTitles: { readonly [R in RejectionReason]: string } = {
  EMPTY_STRUCTURE: 'Operação recusada: a lista está vazia.',
  POSITION_OUT_OF_RANGE: 'Operação recusada: a posição não existe nesta lista.',
  VALUE_NOT_FOUND: 'Operação recusada: valor não encontrado.',
};
