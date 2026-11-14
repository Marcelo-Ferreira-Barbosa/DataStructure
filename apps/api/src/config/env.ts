/** Único lugar que interpreta variáveis de ambiente (falha cedo se inválidas). */
export interface AppConfig {
  nodeEnv: 'development' | 'test' | 'production';
  port: number;
  appOrigin: string;
}

const NODE_ENVS = ['development', 'test', 'production'] as const;

export function loadConfig(env: Record<string, string | undefined>): AppConfig {
  const nodeEnv = env.NODE_ENV ?? 'development';
  if (!(NODE_ENVS as readonly string[]).includes(nodeEnv)) {
    throw new Error(`NODE_ENV inválido: "${nodeEnv}"`);
  }

  const port = Number(env.PORT ?? '3000');
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error(`PORT inválida: "${env.PORT}"`);
  }

  const appOrigin = env.APP_ORIGIN ?? 'http://localhost:5173';
  try {
    new URL(appOrigin);
  } catch {
    throw new Error(`APP_ORIGIN inválida: "${appOrigin}"`);
  }

  return { nodeEnv: nodeEnv as AppConfig['nodeEnv'], port, appOrigin };
}
