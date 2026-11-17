import type { Item, ItemDescriptor } from '../core/item';
import { stackItem } from '../labs/linear/stack/stack';

/** Todos os itens disponíveis. Um item novo entra aqui e em nenhum outro lugar do núcleo. */
const ITEMS: readonly Item[] = [stackItem];

export function listItems(): readonly ItemDescriptor[] {
  return ITEMS.map((item) => item.descriptor);
}

export function getItem(id: string): Item | undefined {
  return ITEMS.find((item) => item.descriptor.id === id);
}
