import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { App } from './App';

it('renderiza o laboratório e a revisão da Engine', () => {
  render(<App />);
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
    'Lista simplesmente encadeada',
  );
  expect(document.body.textContent).toContain('Engine rev. 1');
});
