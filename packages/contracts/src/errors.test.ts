import { describe, expect, it } from 'vitest';
import {
  ERROR_CODES,
  FIELD_ERROR_CODES,
  errorResponseSchema,
  fieldErrorCodeSchema,
  parseWithSchema,
  z,
} from './index';

describe('envelope de erro', () => {
  it('aceita o formato do contrato, com e sem campos', () => {
    expect(
      errorResponseSchema.safeParse({ error: { code: 'NOT_FOUND', message: 'x', requestId: 'r' } })
        .success,
    ).toBe(true);
    expect(
      errorResponseSchema.safeParse({
        error: {
          code: 'VALIDATION_FAILED',
          message: 'x',
          requestId: 'r',
          fields: [{ field: 'name', code: 'TOO_LONG', meta: { max: 80 } }],
        },
      }).success,
    ).toBe(true);
  });

  it('rejeita código fora do catálogo', () => {
    expect(
      errorResponseSchema.safeParse({ error: { code: 'OOPS', message: 'x', requestId: 'r' } })
        .success,
    ).toBe(false);
  });

  it('o catálogo tem os 13 códigos de erro e os 9 códigos de campo do API.md', () => {
    expect(ERROR_CODES).toHaveLength(13);
    expect(FIELD_ERROR_CODES).toHaveLength(9);
    expect(fieldErrorCodeSchema.safeParse('REQUIRED').success).toBe(true);
  });
});

describe('parseWithSchema', () => {
  const schema = z
    .object({
      name: z.string().min(3).max(10),
      age: z.number().int().min(1).max(5),
      email: z.email(),
      kind: z.enum(['a', 'b']),
      nested: z.object({ list: z.array(z.object({ value: z.number() })) }).optional(),
    })
    .strict();
  const valid = { name: 'abcd', age: 3, email: 'a@b.co', kind: 'a' };

  it('devolve os dados quando válidos', () => {
    expect(parseWithSchema(schema, valid)).toEqual({ ok: true, data: valid });
  });

  it('campo ausente é REQUIRED, inclusive em enumeração', () => {
    const result = parseWithSchema(schema, {});
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fields).toEqual(
        expect.arrayContaining([
          { field: 'name', code: 'REQUIRED' },
          { field: 'age', code: 'REQUIRED' },
          { field: 'email', code: 'REQUIRED' },
          { field: 'kind', code: 'REQUIRED' },
        ]),
      );
    }
  });

  it('traduz cada tipo de problema para o catálogo', () => {
    const result = parseWithSchema(schema, {
      name: 'x',
      age: 9,
      email: 'no',
      kind: 'q',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fields).toEqual([
        { field: 'name', code: 'TOO_SHORT', meta: { min: 3 } },
        { field: 'age', code: 'OUT_OF_RANGE', meta: { max: 5 } },
        { field: 'email', code: 'INVALID_FORMAT' },
        { field: 'kind', code: 'NOT_ALLOWED' },
      ]);
    }
  });

  it('texto longo é TOO_LONG e tipo errado é INVALID_TYPE', () => {
    const result = parseWithSchema(schema, { ...valid, name: 'a'.repeat(11), age: 'três' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fields).toContainEqual({ field: 'name', code: 'TOO_LONG', meta: { max: 10 } });
      expect(result.fields).toContainEqual({ field: 'age', code: 'INVALID_TYPE' });
    }
  });

  it('campo desconhecido é rejeitado como NOT_ALLOWED (mass assignment)', () => {
    const result = parseWithSchema(schema, { ...valid, userId: 'x', id: 1 });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fields).toEqual(
        expect.arrayContaining([
          { field: 'userId', code: 'NOT_ALLOWED' },
          { field: 'id', code: 'NOT_ALLOWED' },
        ]),
      );
    }
  });

  it('usa caminho com ponto e índice', () => {
    const result = parseWithSchema(schema, { ...valid, nested: { list: [{ value: 1 }, {}] } });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fields).toEqual([{ field: 'nested.list[1].value', code: 'REQUIRED' }]);
    }
  });

  it('nunca repete o valor recebido (ex.: senha) nos problemas', () => {
    const result = parseWithSchema(z.object({ password: z.string().min(8) }), {
      password: 'segredo',
    });
    expect(result.ok).toBe(false);
    expect(JSON.stringify(result)).not.toContain('segredo');
  });

  it('corpo que não é objeto também é problema (null, texto, lista)', () => {
    for (const body of [null, 'texto', [1]]) {
      expect(parseWithSchema(schema, body).ok).toBe(false);
    }
  });
});
