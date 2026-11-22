import { errorResponseSchema } from '@dss/contracts';
import { afterAll, describe, expect, it } from 'vitest';
import { createApp } from '../../app';
import { createPrismaClient } from '../../database/client';
import { listen, memoryLogger, testConfig } from '../../testing/server';
import { createHealthRepository } from './health.repository';
import { createHealthService } from './health.service';

/**
 * Integração com PostgreSQL REAL. Só roda quando `TEST_DATABASE_URL` aponta para um banco de
 * teste descartável (ex.: o do `infra/compose.yaml`); sem ela, é ignorado e `pnpm test` continua
 * funcionando em máquinas sem banco. Não usa o `DATABASE_URL` do desenvolvimento de propósito.
 */
const testDatabaseUrl = process.env['TEST_DATABASE_URL'];

async function serverFor(databaseUrl: string) {
  const prisma = createPrismaClient(databaseUrl);
  const { logger, entries } = memoryLogger();
  const health = createHealthService(createHealthRepository(prisma), { timeoutMs: 2000 });
  const server = await listen(createApp({ config: testConfig, logger, services: { health } }));
  return {
    server,
    entries,
    close: async () => {
      await server.close();
      await prisma.$disconnect();
    },
  };
}

describe.skipIf(testDatabaseUrl === undefined)('GET /api/health com PostgreSQL real', () => {
  const closers: (() => Promise<void>)[] = [];
  afterAll(async () => {
    for (const close of closers) await close();
  });

  it('200 { status: "ok" } com o banco no ar', async () => {
    const ctx = await serverFor(testDatabaseUrl ?? '');
    closers.push(ctx.close);
    const res = await fetch(`${ctx.server.baseUrl}/api/health`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok' });
  });

  it('503 sem vazar infraestrutura quando o banco está inacessível', async () => {
    const dead = new URL(testDatabaseUrl ?? '');
    dead.port = '1'; // nada escuta aqui
    dead.password = 'senha-que-nao-pode-vazar';
    const ctx = await serverFor(dead.toString());
    closers.push(ctx.close);

    const res = await fetch(`${ctx.server.baseUrl}/api/health`);
    expect(res.status).toBe(503);
    const text = await res.text();
    expect(errorResponseSchema.parse(JSON.parse(text)).error.code).toBe('SERVICE_UNAVAILABLE');
    for (const secret of [
      'senha-que-nao-pode-vazar',
      'ECONNREFUSED',
      'localhost',
      '127.0.0.1',
      'postgres',
    ]) {
      expect(text).not.toContain(secret);
      expect(JSON.stringify(ctx.entries)).not.toContain('senha-que-nao-pode-vazar');
    }
  });
});
