import { describe, expect, it } from 'vitest';
import { loadConfig } from './env';

describe('loadConfig', () => {
  it('aplica padrões de desenvolvimento', () => {
    expect(loadConfig({})).toEqual({
      nodeEnv: 'development',
      port: 3000,
      appOrigin: 'http://localhost:5173',
    });
  });
  it('rejeita porta inválida', () => {
    expect(() => loadConfig({ PORT: 'abc' })).toThrow('PORT');
  });
  it('rejeita NODE_ENV desconhecido', () => {
    expect(() => loadConfig({ NODE_ENV: 'staging' })).toThrow('NODE_ENV');
  });
  it('rejeita origem inválida', () => {
    expect(() => loadConfig({ APP_ORIGIN: 'não é url' })).toThrow('APP_ORIGIN');
  });
});
