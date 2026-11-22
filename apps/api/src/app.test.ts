import { errorResponseSchema, healthResponseSchema } from '@dss/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from './app';
import type { HealthService } from './modules/health/health.service';
import { ServiceUnavailableError } from './shared/errors';
import { listen, memoryLogger, ORIGIN, testConfig, type RunningServer } from './testing/server';

let healthy = true;
const health: HealthService = {
  check: () =>
    healthy ? Promise.resolve({ status: 'ok' }) : Promise.reject(new ServiceUnavailableError()),
};

let server: RunningServer;
const { logger } = memoryLogger();

beforeAll(async () => {
  server = await listen(createApp({ config: testConfig, logger, services: { health } }));
});
afterAll(async () => {
  await server.close();
});

describe('GET /api/health (E-13)', () => {
  it('responde 200 no formato do contrato e nada além disso', async () => {
    healthy = true;
    const res = await fetch(`${server.baseUrl}/api/health`);
    expect(res.status).toBe(200);
    const body: unknown = await res.json();
    expect(healthResponseSchema.safeParse(body).success).toBe(true);
    expect(body).toEqual({ status: 'ok' });
  });

  it('responde 503 SERVICE_UNAVAILABLE no envelope padrão quando o banco não responde', async () => {
    healthy = false;
    const res = await fetch(`${server.baseUrl}/api/health`);
    expect(res.status).toBe(503);
    const body = errorResponseSchema.parse(await res.json());
    expect(body.error.code).toBe('SERVICE_UNAVAILABLE');
    expect(body.error.requestId).toBe(res.headers.get('x-request-id'));
    healthy = true;
  });

  it('HEAD funciona como GET, sem corpo', async () => {
    const res = await fetch(`${server.baseUrl}/api/health`, { method: 'HEAD' });
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('');
  });
});

describe('cabeçalhos de toda resposta', () => {
  it('tem X-Request-Id único, no-store e cabeçalhos de segurança, sem revelar o Express', async () => {
    const a = await fetch(`${server.baseUrl}/api/health`);
    const b = await fetch(`${server.baseUrl}/api/health`);
    const id = a.headers.get('x-request-id') ?? '';
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
    expect(id).not.toBe(b.headers.get('x-request-id'));
    expect(a.headers.get('cache-control')).toBe('no-store');
    expect(a.headers.get('x-content-type-options')).toBe('nosniff');
    expect(a.headers.get('x-powered-by')).toBeNull();
    expect(a.headers.get('server')).toBeNull();
  });

  it('erros também levam os cabeçalhos', async () => {
    const res = await fetch(`${server.baseUrl}/api/nao-existe`);
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(res.headers.get('x-request-id')).not.toBeNull();
  });
});

describe('CORS: só o domínio do Web (Q98)', () => {
  const EVIL = 'https://site-malicioso.example';
  const acao = (res: Response) => res.headers.get('access-control-allow-origin');

  it('origem permitida: libera com credenciais e expõe X-Request-Id', async () => {
    const res = await fetch(`${server.baseUrl}/api/health`, { headers: { Origin: ORIGIN } });
    expect(acao(res)).toBe(ORIGIN);
    expect(res.headers.get('access-control-allow-credentials')).toBe('true');
    expect(res.headers.get('access-control-expose-headers')).toBe('X-Request-Id');
    expect(res.headers.get('vary')).toContain('Origin');
  });

  it('outra origem, "null" ou prefixo parecido: nenhum Access-Control-*', async () => {
    for (const origin of [EVIL, 'null', `${ORIGIN}.evil.example`, 'http://localhost:5174']) {
      const res = await fetch(`${server.baseUrl}/api/health`, { headers: { Origin: origin } });
      expect([...res.headers.keys()].filter((h) => h.startsWith('access-control-'))).toEqual([]);
    }
  });

  it('nunca usa curinga', async () => {
    const res = await fetch(`${server.baseUrl}/api/health`, { headers: { Origin: ORIGIN } });
    expect(acao(res)).not.toBe('*');
  });

  it('pré-verificação da origem permitida: 204 com métodos e cabeçalhos mínimos', async () => {
    const res = await fetch(`${server.baseUrl}/api/projects`, {
      method: 'OPTIONS',
      headers: {
        Origin: ORIGIN,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type',
      },
    });
    expect(res.status).toBe(204);
    expect(acao(res)).toBe(ORIGIN);
    expect(res.headers.get('access-control-allow-methods')).toBe('GET, POST, PATCH, DELETE');
    expect(res.headers.get('access-control-allow-headers')).toBe('Content-Type');
    expect(res.headers.get('access-control-max-age')).toBe('600');
  });

  it('pré-verificação de origem estranha: sem autorização (405, sem Access-Control-*)', async () => {
    const res = await fetch(`${server.baseUrl}/api/health`, {
      method: 'OPTIONS',
      headers: { Origin: EVIL, 'Access-Control-Request-Method': 'GET' },
    });
    expect(res.status).toBe(405);
    expect(acao(res)).toBeNull();
  });
});

describe('rotas e métodos inexistentes', () => {
  it('rota desconhecida sob /api devolve 404 JSON, nunca HTML', async () => {
    const res = await fetch(`${server.baseUrl}/api/nao-existe`);
    expect(res.status).toBe(404);
    expect(res.headers.get('content-type')).toContain('application/json');
    const body = errorResponseSchema.parse(await res.json());
    expect(body.error.code).toBe('NOT_FOUND');
    expect(JSON.stringify(body)).not.toContain('Cannot GET');
  });

  it('fora de /api também é 404 JSON (a entrega do SPA ainda não existe)', async () => {
    const res = await fetch(`${server.baseUrl}/qualquer`);
    expect(res.status).toBe(404);
    expect(errorResponseSchema.safeParse(await res.json()).success).toBe(true);
  });

  it.each(['POST', 'PATCH', 'DELETE', 'PUT'])(
    '%s em /api/health devolve 405 com Allow',
    async (method) => {
      const res = await fetch(`${server.baseUrl}/api/health`, { method });
      expect(res.status).toBe(405);
      expect(res.headers.get('allow')).toBe('GET, HEAD');
      expect(errorResponseSchema.parse(await res.json()).error.code).toBe('METHOD_NOT_ALLOWED');
    },
  );
});
