import type { RequestHandler } from 'express';
import type { HealthService } from './health.service';

/** Só traduz HTTP: chama o serviço e responde. Sem regra de negócio. */
export function createHealthController(service: HealthService): { get: RequestHandler } {
  return {
    get: async (_req, res) => {
      res.json(await service.check());
    },
  };
}
