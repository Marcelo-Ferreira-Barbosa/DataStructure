import { useEffect, useRef, useState, type RefObject } from 'react';

/** Largura usada quando o navegador não mede (testes) ou antes da primeira medição. */
export const FALLBACK_WIDTH = 640;

/** Acompanha a largura de um elemento (o layout do SVG depende dela). */
export function useElementWidth<T extends HTMLElement>(): [RefObject<T | null>, number] {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(FALLBACK_WIDTH);

  useEffect(() => {
    const element = ref.current;
    if (element === null || typeof ResizeObserver === 'undefined') return;
    const measure = (): void => {
      const measured = Math.floor(element.getBoundingClientRect().width);
      if (measured > 0) setWidth(measured);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, []);

  return [ref, width];
}
