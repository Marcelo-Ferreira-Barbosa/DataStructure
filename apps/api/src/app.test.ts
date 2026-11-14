import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { healthResponseSchema } from '@dss/contracts';
import { createApp } from './app';

describe('GET /api/health', () => {
  let server: ReturnType<ReturnType<typeof createApp>['listen']>;
  let baseUrl: string;

  beforeAll(async () => {
    server = createApp().listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });
  afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

  it('responde 200 no formato do contrato', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    expect(res.status).toBe(200);
    expect(healthResponseSchema.safeParse(await res.json()).success).toBe(true);
  });
});
