import { defineConfig } from 'prisma/config';

// O CLI do Prisma não lê o .env sozinho: carrega o da raiz do repositório, se existir.
try {
  process.loadEnvFile(new URL('../../.env', import.meta.url));
} catch {
  // Sem .env: vale o que já estiver no ambiente (CI, contêiner).
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: { url: process.env['DATABASE_URL'] },
});
