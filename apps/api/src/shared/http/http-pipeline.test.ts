import { errorResponseSchema, z } from '@dss/contracts';
import express, { Router } from 'express';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { assembleApp } from '../../app';
import {
  listen,
  memoryLogger,
  ORIGIN,
  testConfig,
  type LogEntry,
  type RunningServer,
} from '../../testing/server';
import { jsonBody } from './json-body';
import { mountRoute } from './route';
import { parseRequest } from './parse-request';
import { requireSameOrigin } from './same-origin';

const bodySchema = z.strictObject({
  nome: z.string().min(3).max(10),
  idade: z.number().int().min(0).max(120),
});
const querySchema = z.object({ q: z.string().max(5).optional() });
const paramsSchema = z.object({ id: z.string().uuid() });

const router = Router();
mountRoute(router, '/itens', {
  post: [
    requireSameOrigin(ORIGIN),
    ...jsonBody('1kb'),
    (req, res) => {
      const { body } = parseRequest(req, { body: bodySchema });
      res.status(201).json(body);
    },
  ],
});
mountRoute(router, '/itens/:id', {
  get: [
    (req, res) => {
      const { params, query } = parseRequest(req, { params: paramsSchema, query: querySchema });
      res.json({ ...params, ...query });
    },
  ],
});
mountRoute(router, '/quebra', {
  get: [
    () => {
      throw new Error('FALHA SECRETA: SELECT * FROM users; postgresql://u:p@h/db');
    },
  ],
});

let server: RunningServer;
let entries: LogEntry[];

beforeAll(async () => {
  const mem = memoryLogger();
  entries = mem.entries;
  server = await listen(assembleApp({ config: testConfig, logger: mem.logger, routers: [router] }));
});
afterAll(async () => {
  await server.close();
});

const post = (body: string, headers: Record<string, string> = {}) =>
  fetch(`${server.baseUrl}/api/itens`, {
    method: 'POST',
    headers: { Origin: ORIGIN, 'Content-Type': 'application/json', ...headers },
    body,
  });

async function errorOf(res: Response) {
  return errorResponseSchema.parse(await res.json()).error;
}

describe('validação de requisições', () => {
  it('aceita corpo válido e devolve só o que o esquema permite', async () => {
    const res = await post(JSON.stringify({ nome: 'Ana', idade: 30 }));
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ nome: 'Ana', idade: 30 });
  });

  it('400 VALIDATION_FAILED com todos os campos errados, sem ecoar valores', async () => {
    const res = await post(JSON.stringify({ nome: 'x', idade: 999, extra: 'senha123' }));
    expect(res.status).toBe(400);
    const error = await errorOf(res);
    expect(error.code).toBe('VALIDATION_FAILED');
    const byField = Object.fromEntries((error.fields ?? []).map((f) => [f.field, f.code]));
    expect(byField).toMatchObject({
      nome: 'TOO_SHORT',
      idade: 'OUT_OF_RANGE',
      extra: 'NOT_ALLOWED',
    });
    expect(JSON.stringify(error)).not.toContain('senha123');
  });

  it('campo ausente é REQUIRED', async () => {
    const error = await errorOf(await post(JSON.stringify({ nome: 'Ana' })));
    expect(error.fields).toContainEqual(
      expect.objectContaining({ field: 'idade', code: 'REQUIRED' }),
    );
  });

  it('valida parâmetros e consulta', async () => {
    const res = await fetch(`${server.baseUrl}/api/itens/nao-e-uuid?q=muito-longo`);
    expect(res.status).toBe(400);
    const fields = (await errorOf(res)).fields?.map((f) => f.field).sort();
    expect(fields).toEqual(['id', 'q']);
  });

  it('parâmetros válidos passam', async () => {
    const id = '3f2b8c1e-9d4a-4e6b-8a1c-5d7e9f0a1b2c';
    const res = await fetch(`${server.baseUrl}/api/itens/${id}?q=ab`);
    expect(await res.json()).toEqual({ id, q: 'ab' });
  });
});

describe('corpo da requisição', () => {
  it('JSON malformado → 400 sem detalhes do parser', async () => {
    const res = await post('{ nome: ');
    expect(res.status).toBe(400);
    const error = await errorOf(res);
    expect(error.code).toBe('VALIDATION_FAILED');
    expect(JSON.stringify(error)).not.toMatch(/Unexpected|position|JSON\.parse/);
  });

  it('Content-Type que não é JSON → 415', async () => {
    const res = await post('nome=Ana', { 'Content-Type': 'text/plain' });
    expect(res.status).toBe(415);
    expect((await errorOf(res)).code).toBe('UNSUPPORTED_MEDIA_TYPE');
  });

  it('corpo acima do limite → 413', async () => {
    const res = await post(JSON.stringify({ nome: 'a'.repeat(5000), idade: 1 }));
    expect(res.status).toBe(413);
    expect((await errorOf(res)).code).toBe('PAYLOAD_TOO_LARGE');
  });
});

describe('verificação de Origin nas mutações', () => {
  it('sem Origin → 403 INVALID_ORIGIN', async () => {
    const res = await fetch(`${server.baseUrl}/api/itens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    expect(res.status).toBe(403);
    expect((await errorOf(res)).code).toBe('INVALID_ORIGIN');
  });

  it('Origin de outro site → 403, antes mesmo de ler o corpo', async () => {
    const res = await post('{}', { Origin: 'https://site-malicioso.example' });
    expect(res.status).toBe(403);
  });
});

describe('métodos e erros inesperados', () => {
  it('método não declarado → 405 com Allow', async () => {
    const res = await fetch(`${server.baseUrl}/api/itens`, { method: 'DELETE' });
    expect(res.status).toBe(405);
    expect(res.headers.get('allow')).toBe('POST');
  });

  it('exceção desconhecida → 500 genérico, sem vazar nada, com log só no servidor', async () => {
    const res = await fetch(`${server.baseUrl}/api/quebra`);
    expect(res.status).toBe(500);
    const text = await res.text();
    expect(text).not.toMatch(/SECRETA|SELECT|postgresql|stack|at .*\.ts/i);
    const error = errorResponseSchema.parse(JSON.parse(text)).error;
    expect(error.code).toBe('INTERNAL');
    expect(error.requestId).toBe(res.headers.get('x-request-id'));
    const logged = entries.find((e) => e.level === 'error');
    expect(logged).toBeDefined();
    expect(logged?.['requestId'] ?? logged?.['id']).toBeDefined();
  });
});

describe('registro de requisições', () => {
  it('não grava query string, corpo nem senhas', async () => {
    await post(JSON.stringify({ nome: 'Ana', idade: 30, senha: 'topsecret' }));
    await fetch(`${server.baseUrl}/api/itens/x?token=abc123`);
    const dump = JSON.stringify(entries);
    expect(dump).not.toContain('topsecret');
    expect(dump).not.toContain('abc123');
    expect(dump).not.toContain('token=');
  });
});

describe('X-Request-Id enviado pelo cliente', () => {
  it('é ignorado (evita injeção em logs)', async () => {
    const res = await fetch(`${server.baseUrl}/api/quebra`, {
      headers: { 'X-Request-Id': 'forjado-por-cliente' },
    });
    expect(res.headers.get('x-request-id')).not.toContain('forjado');
  });
});

void express;
