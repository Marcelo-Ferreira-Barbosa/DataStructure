import type { z } from 'zod';
import type { FieldError, FieldErrorCode } from './errors';

export type ParseResult<T> =
  | { readonly ok: true; readonly data: T }
  | { readonly ok: false; readonly fields: readonly FieldError[] };

/** `['document', 'operations', 3, 'value']` → `document.operations[3].value`. */
export function formatPath(path: readonly PropertyKey[]): string {
  let out = '';
  for (const part of path) {
    if (typeof part === 'number') out += `[${part}]`;
    else out += out === '' ? String(part) : `.${String(part)}`;
  }
  return out;
}

/** Zod só informa o limite violado; o outro lado não existe no problema. */
function bound(issue: z.core.$ZodIssue): FieldError['meta'] {
  if (issue.code === 'too_small') return { min: Number(issue.minimum) };
  if (issue.code === 'too_big') return { max: Number(issue.maximum) };
  return undefined;
}

function sizeCode(issue: z.core.$ZodIssue): FieldErrorCode {
  const isText = 'origin' in issue && (issue.origin === 'string' || issue.origin === 'array');
  if (issue.code === 'too_small') return isText ? 'TOO_SHORT' : 'OUT_OF_RANGE';
  return isText ? 'TOO_LONG' : 'OUT_OF_RANGE';
}

/**
 * Traduz os problemas do Zod para o catálogo da API (API.md §2.10). Nunca devolve `issue.message`
 * nem o valor recebido: só caminho, código e limite, para não repetir dados do cliente (senhas).
 */
function toFieldErrors(issues: readonly z.core.$ZodIssue[]): FieldError[] {
  const fields: FieldError[] = [];
  for (const issue of issues) {
    const field = formatPath(issue.path);
    const missing = !('input' in issue) || issue.input === undefined;
    switch (issue.code) {
      case 'invalid_type':
      case 'invalid_value':
        fields.push({
          field,
          code: missing
            ? 'REQUIRED'
            : issue.code === 'invalid_value'
              ? 'NOT_ALLOWED'
              : 'INVALID_TYPE',
        });
        break;
      case 'too_small':
      case 'too_big': {
        const meta = bound(issue);
        fields.push({ field, code: sizeCode(issue), ...(meta ? { meta } : {}) });
        break;
      }
      case 'invalid_format':
        fields.push({ field, code: 'INVALID_FORMAT' });
        break;
      case 'unrecognized_keys':
        // Campos desconhecidos são rejeitados, um problema por campo (mass assignment).
        for (const key of issue.keys) {
          fields.push({ field: formatPath([...issue.path, key]), code: 'NOT_ALLOWED' });
        }
        break;
      default:
        fields.push({ field, code: 'INVALID_TYPE' });
    }
  }
  return fields;
}

/** Valida `data` com um esquema e devolve os problemas já no formato da API. */
export function parseWithSchema<S extends z.ZodType>(
  schema: S,
  data: unknown,
): ParseResult<z.output<S>> {
  // `reportInput` só serve para distinguir "ausente" de "inválido"; o valor nunca é devolvido.
  const result = schema.safeParse(data, { reportInput: true });
  return result.success
    ? { ok: true, data: result.data }
    : { ok: false, fields: toFieldErrors(result.error.issues) };
}
