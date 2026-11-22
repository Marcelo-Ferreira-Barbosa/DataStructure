import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';

/** Tempo máximo para obter uma conexão do pool; evita requisições penduradas se o banco cair. */
const CONNECTION_TIMEOUT_MS = 3000;

/**
 * Único ponto onde o cliente Prisma nasce. A URL (segredo) vem da configuração validada na
 * subida. Só os repositórios usam o cliente: serviços e rotas nunca o veem (ADR-0008).
 */
export function createPrismaClient(databaseUrl: string): PrismaClient {
  const adapter = new PrismaPg({
    connectionString: databaseUrl,
    connectionTimeoutMillis: CONNECTION_TIMEOUT_MS,
  });
  return new PrismaClient({ adapter });
}

export type { PrismaClient };
