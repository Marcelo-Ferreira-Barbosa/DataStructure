import type { AddressInfo } from 'node:net';
import type express from 'express';
import type { AppConfig } from '../config/env';
import type { Logger } from '../shared/logger';

export const ORIGIN = 'http://localhost:5173';

export const testConfig: AppConfig = {
  nodeEnv: 'test',
  port: 0,
  appOrigin: ORIGIN,
  databaseUrl: 'postgresql://usuario:senha-secreta@localhost:5432/teste',
};

export interface RunningServer {
  baseUrl: string;
  close(): Promise<void>;
}

/** Sobe o app numa porta efêmera, para testar por HTTP de verdade. */
export async function listen(app: express.Express): Promise<RunningServer> {
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  return {
    baseUrl: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

export interface LogEntry {
  level: 'info' | 'error';
  event: string;
  [field: string]: unknown;
}

/** Logger que guarda os eventos em memória, para conferir o que foi (e o que não foi) registrado. */
export function memoryLogger(): { logger: Logger; entries: LogEntry[] } {
  const entries: LogEntry[] = [];
  return {
    entries,
    logger: {
      info: (event, fields) => entries.push({ level: 'info', event, ...fields }),
      error: (event, fields) => entries.push({ level: 'error', event, ...fields }),
    },
  };
}
