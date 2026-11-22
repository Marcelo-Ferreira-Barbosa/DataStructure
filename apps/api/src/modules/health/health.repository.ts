import type { PrismaClient } from '../../database/client';

/** Acesso ao banco para a verificação de saúde: única camada que fala com o Prisma. */
export interface HealthRepository {
  /** Resolve se o banco responde; rejeita se não conseguir falar com ele. */
  ping(): Promise<void>;
}

export function createHealthRepository(prisma: Pick<PrismaClient, '$queryRaw'>): HealthRepository {
  return {
    async ping() {
      await prisma.$queryRaw`SELECT 1`;
    },
  };
}
