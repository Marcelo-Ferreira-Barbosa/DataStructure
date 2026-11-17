import type { ElementId } from './ids';
import type { ItemTypes } from './item-types';
import type { Message } from './message';

export type HighlightTarget =
  | { readonly type: 'element'; readonly id: ElementId }
  | { readonly type: 'position'; readonly index: number }
  /** Intervalo de posições, extremos inclusos. */
  | { readonly type: 'range'; readonly from: number; readonly to: number }
  | { readonly type: 'edge'; readonly from: ElementId; readonly to: ElementId }
  | { readonly type: 'bucket'; readonly index: number };

/** Conjunto FECHADO: todo visualizador precisa tratar todos os papéis. */
export type HighlightRole =
  | 'comparing'
  | 'swapping'
  | 'sorted'
  | 'pivot'
  | 'found'
  | 'not-found'
  | 'search-range'
  | 'inserted'
  | 'removed'
  | 'visiting'
  | 'visited'
  | 'error'
  // ponteiros nomeados
  | 'head'
  | 'tail'
  | 'top'
  | 'front'
  | 'rear'
  | 'current'
  | 'previous'
  | 'root';

export interface Highlight {
  readonly target: HighlightTarget;
  readonly role: HighlightRole;
}

/** Acumulados até o passo (RN-012). Definições exatas: glossário técnico (Q17). */
export interface Counters {
  readonly comparisons: number;
  /** Trocas e movimentações/gravações de elemento. */
  readonly moves: number;
  readonly accesses: number;
}

/** Um momento observável da execução. Imutável e serializável. */
export interface Step<T extends ItemTypes = ItemTypes> {
  /** 0 = estado anterior à operação (RF-020). */
  readonly index: number;
  /** Snapshot COMPLETO da estrutura neste instante. */
  readonly state: T['state'];
  readonly highlights: readonly Highlight[];
  /** Descrição do passo como `{chave, parâmetros}`; o texto vive no catálogo do Web (ADR-0004). */
  readonly message: Message<T['messages']>;
  /** Linha de pseudocódigo corrente, como âncora simbólica. */
  readonly anchor: T['anchors'] | null;
  readonly counters: Counters;
}
