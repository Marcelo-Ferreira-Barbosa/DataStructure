import type { ElementId, Highlight, HighlightRole, LinkedListState } from '@dss/engine';
import { nodes } from '../../../content/pt-BR/text';
import { chainOf } from './layout';
import { roleStyles } from './roles';

/** Papéis de cada nó (por id), a partir dos destaques do passo. */
export function nodeRoles(highlights: readonly Highlight[]): Map<ElementId, HighlightRole[]> {
  const result = new Map<ElementId, HighlightRole[]>();
  for (const { target, role } of highlights) {
    if (target.type !== 'element') continue;
    const list = result.get(target.id) ?? [];
    list.push(role);
    result.set(target.id, list);
  }
  return result;
}

/** Papéis de cada aresta, com a chave `"de>para"`. */
export function edgeRoles(highlights: readonly Highlight[]): Map<string, HighlightRole[]> {
  const result = new Map<string, HighlightRole[]>();
  for (const { target, role } of highlights) {
    if (target.type !== 'edge') continue;
    const key = `${target.from}>${target.to}`;
    result.set(key, [...(result.get(key) ?? []), role]);
  }
  return result;
}

/**
 * Descrição em texto do que está desenhado: usada como nome acessível do SVG (leitor de tela)
 * e nos testes (ARCHITECTURE §8.5).
 */
export function describeList(state: LinkedListState, highlights: readonly Highlight[]): string {
  const chain = chainOf(state);
  const inChain = new Set(chain.map((node) => node.id));
  const parts: string[] = [];

  if (chain.length === 0) {
    parts.push('Lista vazia: head aponta para null.');
  } else {
    parts.push(`Lista com ${nodes(chain.length)}: ${chain.map((node) => node.value).join(', ')}.`);
    const head = chain[0];
    const tail = chain[chain.length - 1];
    if (head !== undefined) parts.push(`Início (head): ${head.value}.`);
    if (tail !== undefined) parts.push(`Fim (tail): ${tail.value}.`);
  }

  const loose = state.nodes.filter((node) => !inChain.has(node.id));
  if (loose.length > 0) {
    parts.push(`Fora da lista: ${loose.map((node) => node.value).join(', ')}.`);
  }

  const roles = nodeRoles(highlights);
  const byId = new Map(state.nodes.map((node) => [node.id, node]));
  for (const [id, list] of roles) {
    const node = byId.get(id);
    if (node === undefined) continue;
    const labels = list
      .map((role) => roleStyles[role].label)
      .filter((label): label is string => label !== null)
      .map((label) => label.replace(/^[^\p{L}]+/u, ''));
    if (labels.length > 0) parts.push(`Nó ${node.value}: ${labels.join(', ')}.`);
  }
  return parts.join(' ');
}
