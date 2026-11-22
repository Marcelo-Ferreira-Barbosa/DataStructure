/** Único lugar que interpreta variáveis de ambiente (falha cedo se inválidas). */
export interface AppConfig {
  nodeEnv: 'development' | 'test' | 'production';
  port: number;
  /** Origem do front-end (só esquema, host e porta), usada na verificação de `Origin`. */
  appOrigin: string;
  /** Segredo: nunca registrar em log nem devolver em resposta. */
  databaseUrl: string;
}

const NODE_ENVS = ['development', 'test', 'production'] as const;
const DATABASE_PROTOCOLS = ['postgresql:', 'postgres:'];

export function loadConfig(env: Record<string, string | undefined>): AppConfig {
  const nodeEnv = env.NODE_ENV ?? 'development';
  if (!(NODE_ENVS as readonly string[]).includes(nodeEnv)) {
    throw new Error(`NODE_ENV inválido: "${nodeEnv}"`);
  }

  const port = Number(env.PORT ?? '3000');
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error(`PORT inválida: "${env.PORT}"`);
  }

  const rawOrigin = env.APP_ORIGIN ?? 'http://localhost:5173';
  let appOrigin: string;
  try {
    // Normaliza: "http://localhost:5173/" e "http://localhost:5173" viram a mesma origem.
    appOrigin = new URL(rawOrigin).origin;
  } catch {
    throw new Error(`APP_ORIGIN inválida: "${rawOrigin}"`);
  }
  if (appOrigin === 'null') throw new Error(`APP_ORIGIN inválida: "${rawOrigin}"`);

  // A mensagem NUNCA inclui o valor: a URL do banco carrega usuário e senha.
  const databaseUrl = env.DATABASE_URL;
  if (databaseUrl === undefined || databaseUrl === '') {
    throw new Error('DATABASE_URL ausente: copie .env.example para .env');
  }
  let parsed: URL;
  try {
    parsed = new URL(databaseUrl);
  } catch {
    throw new Error('DATABASE_URL inválida: não é uma URL');
  }
  if (!DATABASE_PROTOCOLS.includes(parsed.protocol)) {
    throw new Error('DATABASE_URL inválida: use o protocolo postgresql://');
  }

  return { nodeEnv: nodeEnv as AppConfig['nodeEnv'], port, appOrigin, databaseUrl };
}
