/**
 * Registro estruturado simples (uma linha JSON por evento). Sem biblioteca (ADR-0014). Regra do
 * projeto: nunca registrar senhas, tokens, corpos de requisição nem a URL do banco.
 */
export type LogFields = Readonly<Record<string, string | number | boolean | null | undefined>>;

export interface Logger {
  info(event: string, fields?: LogFields): void;
  error(event: string, fields?: LogFields): void;
}

export function createLogger(write: (line: string) => void): Logger {
  const emit = (level: 'info' | 'error', event: string, fields: LogFields = {}): void => {
    write(JSON.stringify({ time: new Date().toISOString(), level, event, ...fields }));
  };
  return {
    info: (event, fields) => {
      emit('info', event, fields);
    },
    error: (event, fields) => {
      emit('error', event, fields);
    },
  };
}

/** Logger que descarta tudo (testes). */
export const silentLogger: Logger = { info: () => undefined, error: () => undefined };
