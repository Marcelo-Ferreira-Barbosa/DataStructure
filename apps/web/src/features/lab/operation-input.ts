import type { OperationDescriptor } from '@dss/engine';

/**
 * Converte o que foi digitado em valores BRUTOS para a Engine. A interface não decide o que é
 * válido: vazio vira `undefined` (a Engine responde REQUIRED), texto não numérico segue como
 * texto (INVALID_TYPE) e números seguem como números (faixa e inteiro são com a Engine).
 */
export function parseField(text: string): number | string | undefined {
  const trimmed = text.trim();
  if (trimmed === '') return undefined;
  const number = Number(trimmed);
  return Number.isNaN(number) ? trimmed : number;
}

/** Monta a operação bruta a partir do descritor e dos campos digitados. */
export function buildOperation(
  descriptor: OperationDescriptor,
  fields: Readonly<Record<string, string>>,
): Record<string, unknown> {
  const operation: Record<string, unknown> = { type: descriptor.type };
  for (const param of descriptor.params) {
    operation[param.name] = parseField(fields[param.name] ?? '');
  }
  return operation;
}

/** "4, 8 15" → [4, 8, 15]; texto vazio → lista vazia. Itens inválidos seguem brutos. */
export function parseValues(text: string): (number | string)[] {
  return text
    .split(/[\s,;]+/)
    .filter((token) => token !== '')
    .map((token) => {
      const number = Number(token);
      return Number.isNaN(number) ? token : number;
    });
}
