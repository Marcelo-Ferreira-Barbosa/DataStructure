import {
  EngineInvariantError,
  generateRandomValues,
  getItem,
  LIMITS,
  type Item,
  type ItemDescriptor,
} from '@dss/engine';
import { createStore, type StoreApi } from 'zustand/vanilla';
import { playbackReducer, type PlaybackAction, type Speed } from './playback';
import { createList, emptySession, runOperation, type LabSession } from './session';

export const ITEM_ID = 'singly-linked-list';

/** Quem decide se a reprodução começa sozinha (movimento reduzido → não). Injetável em testes. */
export type AutoplayPolicy = () => boolean;

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export interface LabActions {
  /** Cria uma lista nova a partir de valores brutos. Apaga histórico e execução. */
  readonly createList: (values: unknown, seed?: number) => void;
  /** Cria a lista de exemplo do descritor. */
  readonly loadExample: () => void;
  /** Cria uma lista aleatória; mesma semente e mesmo tamanho dão a mesma lista. */
  readonly createRandomList: (count: number, seed: number) => void;
  /** Executa uma operação na Engine (única porta de execução da interface). */
  readonly runOperation: (operation: unknown) => void;
  readonly dispatch: (action: PlaybackAction) => void;
  readonly setSpeed: (speed: Speed) => void;
  readonly clearFeedback: () => void;
}

export type LabState = LabSession & {
  /** Descritor do item (operações, parâmetros, limites): estático, vem da Engine. */
  readonly descriptor: ItemDescriptor;
  readonly actions: LabActions;
};
export type LabStore = StoreApi<LabState>;

export interface LabStoreOptions {
  /** Item da Engine usado pela sessão; injetável para testar falhas. */
  readonly item?: Item;
  readonly autoplay?: AutoplayPolicy;
}

function resolveItem(): Item {
  const item = getItem(ITEM_ID);
  if (item === undefined) throw new Error(`Item "${ITEM_ID}" não está no catálogo da Engine`);
  return item;
}

function exampleValues(item: Item): readonly number[] {
  return item.descriptor.examples[0]?.values ?? [];
}

/**
 * Store da sessão do laboratório (ADR-0010). Só estas ações chamam a Engine; os componentes
 * leem estado e disparam ações, e toda a lógica fica em `session.ts` e `playback.ts` (puros).
 */
export function createLabStore(options: LabStoreOptions = {}): LabStore {
  const item = options.item ?? resolveItem();
  const autoplay = options.autoplay ?? ((): boolean => !prefersReducedMotion());

  const initial = item.createInitialState(exampleValues(item));
  if (!initial.ok) throw new Error('A lista de exemplo do descritor foi recusada pela Engine');

  return createStore<LabState>()((set, get) => {
    const update = (next: LabSession): void => {
      set(next);
    };
    return {
      ...emptySession(initial.state),
      descriptor: item.descriptor,
      actions: {
        createList: (values, seed) => {
          update(createList(item, get(), values, seed));
        },
        loadExample: () => {
          update(createList(item, get(), exampleValues(item)));
        },
        createRandomList: (count, seed) => {
          try {
            update(createList(item, get(), generateRandomValues(seed, count), seed));
          } catch (error) {
            if (!(error instanceof EngineInvariantError)) throw error;
            // A Engine recusou o tamanho pedido: aparece como problema do campo, não como falha.
            set({
              feedback: {
                source: 'list',
                problems: [
                  {
                    code: 'OUT_OF_RANGE',
                    path: 'count',
                    meta: { min: 0, max: LIMITS.maxElements },
                  },
                ],
              },
            });
          }
        },
        runOperation: (operation) => {
          update(runOperation(item, get(), operation, autoplay()));
        },
        dispatch: (action) => {
          const { playback } = get();
          set({ playback: playbackReducer(playback, action) });
        },
        setSpeed: (speed) => {
          const { playback } = get();
          set({ playback: playbackReducer(playback, { type: 'setSpeed', speed }) });
        },
        clearFeedback: () => {
          set({ feedback: null });
        },
      },
    };
  });
}
