import { describe, expect, it } from 'vitest';
import { ServiceUnavailableError } from '../../shared/errors';
import type { HealthRepository } from './health.repository';
import { createHealthService } from './health.service';

const repo = (ping: () => Promise<void>): HealthRepository => ({ ping });

describe('HealthService', () => {
  it('ok quando o banco responde', async () => {
    const service = createHealthService(repo(() => Promise.resolve()));
    await expect(service.check()).resolves.toEqual({ status: 'ok' });
  });

  it('SERVICE_UNAVAILABLE quando o banco falha, escondendo a causa', async () => {
    const service = createHealthService(
      repo(() => Promise.reject(new Error('senha incorreta para usuario dss'))),
    );
    const err: unknown = await service.check().catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ServiceUnavailableError);
    expect((err as Error).message).not.toContain('senha');
    expect((err as { cause?: unknown }).cause).toBeUndefined();
  });

  it('SERVICE_UNAVAILABLE quando o banco demora além do limite', async () => {
    const service = createHealthService(
      repo(() => new Promise(() => undefined)),
      { timeoutMs: 20 },
    );
    await expect(service.check()).rejects.toBeInstanceOf(ServiceUnavailableError);
  });
});
