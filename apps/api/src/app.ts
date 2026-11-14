import express from 'express';
import type { HealthResponse } from '@dss/contracts';

/** Constrói a aplicação sem iniciar o servidor (facilita testes em porta efêmera). */
export function createApp(): express.Express {
  const app = express();
  app.disable('x-powered-by');

  app.get('/api/health', (_req, res) => {
    const body: HealthResponse = { status: 'ok' };
    res.json(body);
  });

  return app;
}
