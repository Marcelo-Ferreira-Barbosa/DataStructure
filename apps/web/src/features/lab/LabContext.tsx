import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useStore } from 'zustand';
import { createLabStore, type LabActions, type LabState, type LabStore } from './store';

const LabContext = createContext<LabStore | null>(null);

export function LabProvider({ store, children }: { store?: LabStore; children: ReactNode }) {
  // Uma store por montagem, criada uma única vez (inicializador preguiçoso do estado).
  const [owned] = useState<LabStore>(() => store ?? createLabStore());
  return <LabContext.Provider value={store ?? owned}>{children}</LabContext.Provider>;
}

function useLabStore(): LabStore {
  const store = useContext(LabContext);
  if (store === null) throw new Error('Componente do laboratório fora do <LabProvider>');
  return store;
}

/** Lê uma fatia do estado (seletor). */
export function useLab<T>(selector: (state: LabState) => T): T {
  return useStore(useLabStore(), selector);
}

export function useLabActions(): LabActions {
  return useStore(useLabStore(), (state) => state.actions);
}

/**
 * Relógio da reprodução: só dispara `tick` na velocidade escolhida. Quem decide o que o tick
 * faz é o reducer (puro); um tick atrasado depois de pausar é ignorado por ele.
 */
export const BASE_STEP_MS = 900;

export function useAutoplay(): void {
  const store = useLabStore();
  const status = useStore(store, (s) => s.playback.status);
  const cursor = useStore(store, (s) => s.playback.cursor);
  const speed = useStore(store, (s) => s.playback.speed);
  useEffect(() => {
    if (status !== 'playing') return;
    const timer = setTimeout(() => {
      store.getState().actions.dispatch({ type: 'tick' });
    }, BASE_STEP_MS / speed);
    return () => {
      clearTimeout(timer);
    };
  }, [store, status, cursor, speed]);
}
