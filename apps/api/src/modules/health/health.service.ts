import type { HealthResponse } from '@dss/contracts';
import { ServiceUnavailableError } from '../../shared/errors';
import { withTimeout } from '../../shared/timeout';
import type { HealthRepository } from './health.repository';

export interface HealthService {
  /** `{ status: 'ok' }` se o banco responde a tempo; senão lança `ServiceUnavailableError`. */
  check(): Promise<HealthResponse>;
}

const DEFAULT_TIMEOUT_MS = 2000;

/**
 * Regra de negócio da saúde (E-13): o serviço só está "ok" se alcança o banco. Não conhece
 * Express nem Prisma. A causa da falha (rede, senha, timeout) NÃO sai daqui: o cliente só fica
 * sabendo que está indisponível, para não revelar a infraestrutura.
 */
export function createHealthService(
  repository: HealthRepository,
  options: { timeoutMs?: number } = {},
): HealthService {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  return {
    async check() {
      try {
        await withTimeout(repository.ping(), timeoutMs);
      } catch {
        throw new ServiceUnavailableError();
      }
      return { status: 'ok' };
    },
  };
}
