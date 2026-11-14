import { describe, expect, it } from 'vitest';
import { healthResponseSchema } from './index';

describe('contracts', () => {
  it('aceita a resposta de saúde válida', () => {
    expect(healthResponseSchema.safeParse({ status: 'ok' }).success).toBe(true);
  });
  it('rejeita valor inesperado', () => {
    expect(healthResponseSchema.safeParse({ status: 'down' }).success).toBe(false);
  });
});
