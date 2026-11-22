import express from 'express';
import type { AppConfig } from './config/env';
import { createHealthRouter } from './modules/health/health.routes';
import type { HealthService } from './modules/health/health.service';
import { cors } from './shared/http/cors';
import { errorHandler, notFoundHandler } from './shared/http/error-handler';
import { requestId } from './shared/http/request-id';
import { requestLogger } from './shared/http/request-logger';
import { securityHeaders } from './shared/http/security-headers';
import type { Logger } from './shared/logger';

/** Montagem genérica: cabeçalhos, registro, rotas dos módulos, 404 e tratador de erros. */
export interface AssemblyOptions {
  config: AppConfig;
  logger: Logger;
  /** Roteadores dos módulos, todos montados sob `/api`. */
  routers: readonly express.Router[];
}

/**
 * Constrói a aplicação sem iniciar o servidor (facilita testes em porta efêmera, ADR-0008).
 * Ordem: identificação → registro → cabeçalhos → CORS → rotas → 404 → tratador de erros.
 */
export function assembleApp({ config, logger, routers }: AssemblyOptions): express.Express {
  const app = express();
  app.disable('x-powered-by');

  app.use(requestId());
  app.use(requestLogger(logger));
  app.use(securityHeaders());
  app.use(cors(config.appOrigin));

  for (const router of routers) app.use('/api', router);

  app.use(notFoundHandler);
  app.use(errorHandler(logger, { production: config.nodeEnv === 'production' }));

  return app;
}

/** Dependências da aplicação, montadas em `main.ts` (passagem manual, sem contêiner de DI). */
export interface AppDependencies {
  config: AppConfig;
  logger: Logger;
  services: {
    health: HealthService;
  };
}

/** A aplicação real: cada módulo entra aqui com o seu roteador. */
export function createApp({ config, logger, services }: AppDependencies): express.Express {
  return assembleApp({ config, logger, routers: [createHealthRouter(services.health)] });
}
