import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it } from 'vitest';
import { App } from './App';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

it('renderiza o título e a revisão da Engine', async () => {
  const container = document.createElement('div');
  await act(async () => {
    createRoot(container).render(<App />);
  });
  expect(container.querySelector('h1')?.textContent).toBe('DataStructure Studio');
  expect(container.textContent).toContain('Engine rev. 0');
});
