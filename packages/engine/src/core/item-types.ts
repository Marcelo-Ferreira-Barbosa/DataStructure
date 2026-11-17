import type { MessageCatalog } from './message';
import type { StructureState } from './state';

/** A operação: `type` + parâmetros planos e serializáveis. É também o que se persiste (ADR-0006). */
export interface Operation {
  readonly type: string;
}

/** Agrupa os tipos de um item. Um único parâmetro de tipo evita propagar quatro em cada contrato. */
export interface ItemTypes {
  readonly state: StructureState;
  readonly operation: Operation;
  readonly messages: MessageCatalog;
  readonly anchors: string;
}
