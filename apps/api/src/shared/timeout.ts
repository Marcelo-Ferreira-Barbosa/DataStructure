export class TimeoutError extends Error {
  constructor() {
    super('Tempo esgotado.');
    this.name = 'TimeoutError';
  }
}

/** Rejeita com `TimeoutError` se `promise` não terminar em `ms` (e não deixa o timer pendurado). */
export async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new TimeoutError());
    }, ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
}
