import type { HighlightRole } from '@dss/engine';

/**
 * Aparência de cada papel de destaque. O mapa é exaustivo (`Record<HighlightRole, …>`): um papel
 * novo na Engine é erro de compilação aqui. Cor NUNCA é o único sinal (RNF-018): todo papel
 * usado tem também um marcador de texto, e os de remoção/inserção mudam a forma.
 */
export interface RoleStyle {
  /** Marcador de texto sob o nó; `null` = não gera marcador próprio. */
  readonly label: string | null;
  readonly stroke: string;
  readonly text: string;
  /** Maior vence a cor da borda quando um nó tem mais de um papel. */
  readonly priority: number;
}

const NEUTRAL = { stroke: 'stroke-border-strong', text: 'fill-muted' } as const;

export const roleStyles: { readonly [R in HighlightRole]: RoleStyle } = {
  // Usados pela lista
  removed: {
    label: '✕ removido',
    stroke: 'stroke-role-removed',
    text: 'fill-role-removed',
    priority: 9,
  },
  found: {
    label: '★ encontrado',
    stroke: 'stroke-role-found',
    text: 'fill-role-found',
    priority: 8,
  },
  'not-found': {
    label: '? ausente',
    stroke: 'stroke-role-notfound',
    text: 'fill-role-notfound',
    priority: 8,
  },
  inserted: {
    label: '＋ novo',
    stroke: 'stroke-role-inserted',
    text: 'fill-role-inserted',
    priority: 7,
  },
  current: {
    label: '▶ atual',
    stroke: 'stroke-role-current',
    text: 'fill-role-current',
    priority: 6,
  },
  previous: {
    label: 'anterior',
    stroke: 'stroke-role-previous',
    text: 'fill-role-previous',
    priority: 5,
  },
  visited: {
    label: '✓ visitado',
    stroke: 'stroke-role-visited',
    text: 'fill-role-visited',
    priority: 3,
  },
  // head e tail já aparecem como rótulos fixos (a partir do estado); o papel só os enfatiza
  head: { label: null, ...NEUTRAL, priority: 1 },
  tail: { label: null, ...NEUTRAL, priority: 1 },
  // Provisórios: papéis de outras estruturas, que a lista não emite. Serão desenhados quando o
  // laboratório correspondente existir.
  comparing: { label: null, ...NEUTRAL, priority: 0 },
  swapping: { label: null, ...NEUTRAL, priority: 0 },
  sorted: { label: null, ...NEUTRAL, priority: 0 },
  pivot: { label: null, ...NEUTRAL, priority: 0 },
  'search-range': { label: null, ...NEUTRAL, priority: 0 },
  visiting: { label: null, ...NEUTRAL, priority: 0 },
  error: { label: null, ...NEUTRAL, priority: 0 },
  top: { label: null, ...NEUTRAL, priority: 0 },
  front: { label: null, ...NEUTRAL, priority: 0 },
  rear: { label: null, ...NEUTRAL, priority: 0 },
  root: { label: null, ...NEUTRAL, priority: 0 },
};

/** O papel de maior prioridade (define a borda), ou `null` se não há destaque. */
export function dominantRole(roles: readonly HighlightRole[]): HighlightRole | null {
  let best: HighlightRole | null = null;
  for (const role of roles) {
    if (best === null || roleStyles[role].priority > roleStyles[best].priority) best = role;
  }
  return best;
}
