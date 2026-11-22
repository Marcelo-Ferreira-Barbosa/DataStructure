import { describe, expect, it } from 'vitest';
import { loadConfig } from './env';

const DB = 'postgresql://usuario:senha-secreta@localhost:5432/banco';

describe('loadConfig', () => {
  it('aplica padrões de desenvolvimento, exceto o banco, que é obrigatório', () => {
    expect(loadConfig({ DATABASE_URL: DB })).toEqual({
      nodeEnv: 'development',
      port: 3000,
      appOrigin: 'http://localhost:5173',
      databaseUrl: DB,
    });
  });

  it('rejeita porta inválida', () => {
    expect(() => loadConfig({ DATABASE_URL: DB, PORT: 'abc' })).toThrow('PORT');
    expect(() => loadConfig({ DATABASE_URL: DB, PORT: '70000' })).toThrow('PORT');
    expect(() => loadConfig({ DATABASE_URL: DB, PORT: '3.5' })).toThrow('PORT');
  });

  it('rejeita NODE_ENV desconhecido', () => {
    expect(() => loadConfig({ DATABASE_URL: DB, NODE_ENV: 'staging' })).toThrow('NODE_ENV');
  });

  it('rejeita origem inválida e normaliza a válida', () => {
    expect(() => loadConfig({ DATABASE_URL: DB, APP_ORIGIN: 'não é url' })).toThrow('APP_ORIGIN');
    expect(
      loadConfig({ DATABASE_URL: DB, APP_ORIGIN: 'https://app.exemplo.com/algum/caminho/' })
        .appOrigin,
    ).toBe('https://app.exemplo.com');
  });

  it('exige DATABASE_URL (falha cedo, com instrução)', () => {
    expect(() => loadConfig({})).toThrow('DATABASE_URL ausente');
    expect(() => loadConfig({ DATABASE_URL: '' })).toThrow('DATABASE_URL ausente');
  });

  it('aceita os dois esquemas do PostgreSQL e rejeita outros', () => {
    expect(loadConfig({ DATABASE_URL: 'postgres://u:p@h/db' }).databaseUrl).toContain(
      'postgres://',
    );
    expect(() => loadConfig({ DATABASE_URL: 'mysql://u:p@h/db' })).toThrow('postgresql://');
    expect(() => loadConfig({ DATABASE_URL: 'isso não é url' })).toThrow('não é uma URL');
  });

  it('a mensagem de erro do banco NUNCA contém a URL nem a senha', () => {
    for (const url of ['mysql://usuario:senha-secreta@h/db', 'senha-secreta']) {
      try {
        loadConfig({ DATABASE_URL: url });
        throw new Error('deveria ter falhado');
      } catch (error) {
        expect(String(error)).not.toContain('senha-secreta');
        expect(String(error)).not.toContain('usuario');
      }
    }
  });
});
