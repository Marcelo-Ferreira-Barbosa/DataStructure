import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

// As variáveis ficam no .env da raiz do repositório.
const envDir = '../..';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, envDir, '');
  return {
    plugins: [react(), tailwindcss()],
    envDir,
    server: {
      port: 5173,
      // Mesma origem em desenvolvimento: /api vai para o Express.
      proxy: { '/api': `http://localhost:${env.PORT ?? '3000'}` },
    },
    test: {
      environment: 'jsdom',
      include: ['src/**/*.test.{ts,tsx}'],
      setupFiles: ['src/test-setup.ts'],
    },
  };
});
