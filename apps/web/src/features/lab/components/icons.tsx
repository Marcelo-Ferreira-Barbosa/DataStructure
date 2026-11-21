import type { ReactNode } from 'react';

/** Ícones embutidos (INTERFACE.md §3.5): sem biblioteca. Decorativos: o botão tem rótulo. */
function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export const RestartIcon = () => (
  <Icon>
    <path d="M12 5V2L7 6l5 4V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z" />
  </Icon>
);
export const PreviousIcon = () => (
  <Icon>
    <path d="M6 6h2v12H6zM9.5 12 18 6v12z" />
  </Icon>
);
export const PlayIcon = () => (
  <Icon>
    <path d="M8 5v14l11-7z" />
  </Icon>
);
export const PauseIcon = () => (
  <Icon>
    <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
  </Icon>
);
export const NextIcon = () => (
  <Icon>
    <path d="M16 6h2v12h-2zM6 18V6l8.5 6z" />
  </Icon>
);
export const EndIcon = () => (
  <Icon>
    <path d="M5 6l8.5 6L5 18zM15 6h2v12h-2z" />
  </Icon>
);
