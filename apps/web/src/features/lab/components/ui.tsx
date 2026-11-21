import type { ReactNode } from 'react';

/** Cartão com título; o título nomeia a região para leitores de tela. */
export function Panel({
  id,
  title,
  children,
  className = '',
}: {
  id: string;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      aria-labelledby={`${id}-title`}
      className={`min-w-0 rounded-2xl border border-border bg-surface p-4 ${className}`}
    >
      <h2 id={`${id}-title`} className="mb-3 text-base font-semibold text-text">
        {title}
      </h2>
      {children}
    </section>
  );
}

/** Alvos de toque de pelo menos 44 px (mínimo próprio do projeto; WCAG 2.2 AA pede 24 px). */
const BASE =
  'inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-[10px] px-3 font-medium disabled:cursor-not-allowed disabled:opacity-50';

export const primaryButton = `${BASE} bg-btn text-white hover:bg-btn-hover`;
export const secondaryButton = `${BASE} border border-border-strong bg-raised text-text hover:bg-raised-2`;
export const fieldClass =
  'min-h-11 w-full rounded-[10px] border border-border-strong bg-raised px-3 text-text placeholder:text-faint';
export const labelClass = 'mb-1 block text-sm font-medium text-text';
export const hintClass = 'mt-1 text-sm text-muted';
export const errorClass = 'mt-1 text-sm text-err';
