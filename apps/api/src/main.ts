import { createApp } from './app';
import { loadConfig } from './config/env';
import { createPrismaClient } from './database/client';
import { createHealthRepository } from './modules/health/health.repository';
import { createHealthService } from './modules/health/health.service';
import { createLogger } from './shared/logger';

// Composição: o único lugar que liga configuração, banco, repositórios e serviços.
const config = loadConfig(process.env);
const logger = createLogger((line) => process.stdout.write(`${line}\n`));
const prisma = createPrismaClient(config.databaseUrl);

const app = createApp({
  config,
  logger,
  services: { health: createHealthService(createHealthRepository(prisma)) },
});

const server = app.listen(config.port, () => {
  // A URL do banco nunca é registrada.
  logger.info('server_started', { port: config.port, env: config.nodeEnv });
});

let stopping = false;
function shutdown(signal: string): void {
  if (stopping) return;
  stopping = true;
  logger.info('server_stopping', { signal });
  server.close(() => {
    void prisma.$disconnect().finally(() => process.exit(0));
  });
}
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    shutdown(signal);
  });
}
