import type { ElementId, LinkedListState, ListNode } from '@dss/engine';

/** Medidas em unidades do SVG (1 unidade = 1 px na escala natural). */
export const GEOMETRY = {
  nodeW: 96,
  valueW: 60,
  nodeH: 52,
  gapX: 44,
  margin: 28,
  top: 8,
  /** Faixa sob o nó: rótulos head/tail, marcadores de papel e id. */
  textH: 60,
  gapY: 30,
  trayLabelH: 26,
  terminalW: 64,
  terminalH: 40,
} as const;

const ROW_PITCH = GEOMETRY.nodeH + GEOMETRY.textH + GEOMETRY.gapY;

export interface PlacedNode {
  readonly node: ListNode;
  readonly x: number;
  readonly y: number;
  /** `chain` = alcançável a partir de `head`; `tray` = solto (recém-criado ou já desligado). */
  readonly zone: 'chain' | 'tray';
  /** Posição na lista (0 = primeiro) para nós da cadeia; `null` para nós soltos. */
  readonly position: number | null;
}

export interface PlacedEdge {
  readonly from: ElementId;
  /** `'terminal'` = a caixa `null` ao fim da cadeia. */
  readonly to: ElementId | 'terminal';
  readonly path: string;
}

export interface Layout {
  readonly width: number;
  readonly height: number;
  readonly nodes: readonly PlacedNode[];
  /** Caixa `null` que fecha a cadeia (sempre existe; numa lista vazia é onde `head` aponta). */
  readonly terminal: { readonly x: number; readonly y: number };
  readonly edges: readonly PlacedEdge[];
  /** Posição do rótulo "nós soltos", ou `null` se não há nós soltos. */
  readonly trayLabel: { readonly x: number; readonly y: number } | null;
  readonly perRow: number;
}

/** Nós na ordem de `head → next` (a mesma definição de "estar na lista" da Engine). */
export function chainOf(state: LinkedListState): readonly ListNode[] {
  const byId = new Map<ElementId, ListNode>(state.nodes.map((node) => [node.id, node]));
  const chain: ListNode[] = [];
  const seen = new Set<ElementId>();
  let current = state.head === null ? undefined : byId.get(state.head);
  while (current !== undefined && !seen.has(current.id)) {
    seen.add(current.id);
    chain.push(current);
    current = current.next === null ? undefined : byId.get(current.next);
  }
  return chain;
}

/** Função pura `(estado, largura) → posições`: testável sem navegador (ADR-0011). */
export function layoutList(state: LinkedListState, width: number): Layout {
  const g = GEOMETRY;
  const usable = Math.max(width, g.nodeW + 2 * g.margin);
  const perRow = Math.max(1, Math.floor((usable - 2 * g.margin + g.gapX) / (g.nodeW + g.gapX)));

  const chain = chainOf(state);
  const inChain = new Set(chain.map((node) => node.id));
  const loose = state.nodes.filter((node) => !inChain.has(node.id));

  const cell = (index: number, top: number): { x: number; y: number } => ({
    x: g.margin + (index % perRow) * (g.nodeW + g.gapX),
    y: top + Math.floor(index / perRow) * ROW_PITCH,
  });

  const placed: PlacedNode[] = chain.map((node, i) => ({
    node,
    ...cell(i, g.top),
    zone: 'chain',
    position: i,
  }));

  const terminalCell = cell(chain.length, g.top);
  const terminal = {
    x: terminalCell.x,
    y: terminalCell.y + (g.nodeH - g.terminalH) / 2,
  };

  const chainRows = Math.ceil((chain.length + 1) / perRow);
  const chainBottom = g.top + chainRows * ROW_PITCH;

  let trayLabel: Layout['trayLabel'] = null;
  let bottom = chainBottom;
  if (loose.length > 0) {
    const trayTop = chainBottom + g.trayLabelH;
    trayLabel = { x: g.margin, y: chainBottom + 14 };
    loose.forEach((node, i) => {
      placed.push({ node, ...cell(i, trayTop), zone: 'tray', position: null });
    });
    bottom = trayTop + Math.ceil(loose.length / perRow) * ROW_PITCH;
  }

  const byId = new Map<ElementId, PlacedNode>(placed.map((p) => [p.node.id, p]));
  const edges: PlacedEdge[] = [];

  // Cadeia: cada nó aponta para o próximo espaço (outro nó ou a caixa `null`).
  chain.forEach((node, i) => {
    const from = placed[i];
    if (from === undefined) return;
    const next = chain[i + 1];
    const toCell = next === undefined ? terminalCell : cell(i + 1, g.top);
    const sameRow = Math.floor((i + 1) / perRow) === Math.floor(i / perRow);
    const cy = from.y + g.nodeH / 2;
    const startX = from.x + g.nodeW;
    const path = sameRow
      ? `M ${startX} ${cy} H ${toCell.x - 3}`
      : wrapPath(startX, cy, from.y, toCell.x, toCell.y + g.nodeH / 2, perRow);
    if (next === undefined || node.next === next.id) {
      edges.push({ from: node.id, to: next === undefined ? 'terminal' : next.id, path });
    }
  });

  // Nós soltos que apontam para algum nó: seta livre (por exemplo, o novo nó antes de ser ligado).
  for (const from of placed.filter((p) => p.zone === 'tray')) {
    const target = from.node.next === null ? undefined : byId.get(from.node.next);
    if (target === undefined || from.node.next === null) continue;
    const sx = from.x + g.nodeW - (g.nodeW - g.valueW) / 2;
    const path =
      target.y < from.y
        ? `M ${sx} ${from.y} L ${target.x + g.nodeW - 10} ${target.y + g.nodeH + 3}`
        : `M ${from.x + g.nodeW} ${from.y + g.nodeH / 2} L ${target.x - 3} ${target.y + g.nodeH / 2}`;
    edges.push({ from: from.node.id, to: from.node.next, path });
  }

  return {
    width: usable,
    height: bottom,
    nodes: placed,
    terminal,
    edges,
    trayLabel,
    perRow,
  };
}

/**
 * Seta que quebra de linha: sai pela direita da última coluna, desce pela margem, corre na
 * faixa entre as linhas e entra pela esquerda do primeiro nó da linha seguinte. Tudo corre
 * nas margens e na folga entre linhas, onde não há texto.
 */
function wrapPath(
  startX: number,
  cy: number,
  rowY: number,
  endX: number,
  endCy: number,
  perRow: number,
): string {
  const g = GEOMETRY;
  const rightX = g.margin + perRow * g.nodeW + (perRow - 1) * g.gapX + g.margin / 2;
  const leftX = g.margin / 2;
  const laneY = rowY + g.nodeH + g.textH + g.gapY / 2;
  return `M ${startX} ${cy} H ${rightX} V ${laneY} H ${leftX} V ${endCy} H ${endX - 3}`;
}
