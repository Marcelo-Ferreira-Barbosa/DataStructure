import type { Execution } from '@dss/engine';
import { nodes } from './text';

/** Frase do resultado de uma execução concluída, a partir do `result` real da Engine. */
export function describeResult(execution: Execution): string {
  const { result, operation, operationName, metadata } = execution;
  switch (result.type) {
    case 'none':
      return `Pronto: a lista agora tem ${nodes(metadata.elementsAfter)}.`;
    case 'value':
      return operationName === 'getAt'
        ? `Valor lido: ${result.value}.`
        : `Valor removido: ${result.value}.`;
    case 'found': {
      const value = (operation as { value?: number }).value;
      return `Encontrado: ${value ?? 'o valor'} está na posição ${result.index}.`;
    }
    case 'not-found': {
      const value = (operation as { value?: number }).value;
      return `${value ?? 'O valor'} não está na lista (percorreu ${nodes(metadata.elementsBefore)}).`;
    }
    case 'values':
      return `Array: [${result.values.join(', ')}].`;
  }
}
