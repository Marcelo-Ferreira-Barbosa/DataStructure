import { Router } from 'express';
import { mountRoute } from '../../shared/http/route';
import type { HealthService } from './health.service';
import { createHealthController } from './health.controller';

/** E-13: GET /api/health (pública). */
export function createHealthRouter(service: HealthService): Router {
  const router = Router();
  const controller = createHealthController(service);
  mountRoute(router, '/health', { get: [controller.get] });
  return router;
}
