import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Sem `globals`, a Testing Library não registra a limpeza sozinha.
afterEach(() => {
  cleanup();
});
