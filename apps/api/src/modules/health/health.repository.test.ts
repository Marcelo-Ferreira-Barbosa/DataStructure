import { describe, expect, it, vi } from 'vitest';
import { createHealthRepository } from './health.repository';

describe('HealthRepository', () => {
  it('executa uma consulta trivial no banco', async () => {
    const queryRaw = vi.fn().mockResolvedValue([{ '?column?': 1 }]);
    await createHealthRepository({ $queryRaw: queryRaw } as never).ping();
    expect(queryRaw).toHaveBeenCalledTimes(1);
  });

  it('propaga a falha (quem decide o que mostrar é o serviço)', async () => {
    const queryRaw = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));
    await expect(createHealthRepository({ $queryRaw: queryRaw } as never).ping()).rejects.toThrow(
      'ECONNREFUSED',
    );
  });
});
