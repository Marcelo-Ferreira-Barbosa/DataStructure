import { createApp } from './app';
import { loadConfig } from './config/env';

const config = loadConfig(process.env);
const server = createApp().listen(config.port, () => {
  console.log(`API em http://localhost:${config.port} (${config.nodeEnv})`);
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
