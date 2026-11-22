import { parseWithSchema, type FieldError, type z } from '@dss/contracts';
import type { Request } from 'express';
import { ValidationError } from '../errors';

interface RequestSchemas {
  params?: z.ZodType;
  query?: z.ZodType;
  body?: z.ZodType;
}

type Parsed<S extends RequestSchemas> = {
  [K in keyof S & keyof RequestSchemas]: S[K] extends z.ZodType ? z.output<S[K]> : never;
};

/**
 * Valida parâmetros de rota, consulta e corpo com esquemas de `contracts` (RNF-003). Entrada
 * inválida lança `ValidationError` (400) com TODOS os problemas, no formato do catálogo. O que
 * sai daqui é tipado e é o ÚNICO dado que serviços e repositórios devem usar: nunca `req.body`
 * cru, que é o que evita *mass assignment*.
 */
export function parseRequest<S extends RequestSchemas>(req: Request, schemas: S): Parsed<S> {
  const parsed: Record<string, unknown> = {};
  const problems: FieldError[] = [];

  const sources: readonly (readonly [string, unknown, z.ZodType | undefined])[] = [
    ['params', req.params, schemas.params],
    ['query', req.query, schemas.query],
    ['body', req.body as unknown, schemas.body],
  ];

  for (const [name, value, schema] of sources) {
    if (schema === undefined) continue;
    const result = parseWithSchema(schema, value);
    if (result.ok) parsed[name] = result.data;
    else problems.push(...result.fields);
  }

  if (problems.length > 0) throw new ValidationError(problems);
  return parsed as Parsed<S>;
}
