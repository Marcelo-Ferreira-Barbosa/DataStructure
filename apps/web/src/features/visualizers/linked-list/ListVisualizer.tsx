import type { Highlight, HighlightRole, StructureState } from '@dss/engine';
import { describeList, edgeRoles, nodeRoles } from './describe';
import { GEOMETRY, layoutList, type PlacedNode } from './layout';
import { dominantRole, roleStyles } from './roles';
import { useElementWidth } from '../useElementWidth';

interface Props {
  readonly state: StructureState;
  readonly highlights: readonly Highlight[];
}

const { nodeW, valueW, nodeH, terminalW, terminalH } = GEOMETRY;
const POINTER_W = nodeW - valueW;

/** Texto com contorno da cor do fundo: continua legível se uma seta passar por trás. */
const HALO = 'paint-order-stroke stroke-bg';

export function ListVisualizer({ state, highlights }: Props) {
  const [ref, width] = useElementWidth<HTMLDivElement>();

  return (
    <div ref={ref} className="w-full">
      {state.kind === 'linked-list' ? (
        <ListDrawing state={state} highlights={highlights} width={width} />
      ) : (
        <p className="text-muted">Visualização indisponível para este tipo de estrutura.</p>
      )}
    </div>
  );
}

function ListDrawing({
  state,
  highlights,
  width,
}: {
  state: Extract<StructureState, { kind: 'linked-list' }>;
  highlights: readonly Highlight[];
  width: number;
}) {
  const layout = layoutList(state, width);
  const roles = nodeRoles(highlights);
  const edgeHighlights = edgeRoles(highlights);

  const headId = state.head;
  const tailId = state.tail;

  return (
    <svg
      role="img"
      aria-label={describeList(state, highlights)}
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      width={layout.width}
      height={layout.height}
      className="block max-w-full"
      data-testid="list-svg"
    >
      <defs>
        <marker
          id="dss-arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" />
        </marker>
      </defs>

      {/* Setas primeiro, para os nós ficarem por cima. */}
      {layout.edges.map((edge) => {
        const key = `${edge.from}>${edge.to === 'terminal' ? 'terminal' : edge.to}`;
        const marked = edgeHighlights.get(key) ?? [];
        const role = dominantRole(marked);
        return (
          <path
            key={key}
            d={edge.path}
            data-edge={key}
            data-roles={marked.join(' ')}
            fill="none"
            strokeLinejoin="round"
            markerEnd="url(#dss-arrow)"
            className={`transition-[stroke,stroke-width] duration-200 motion-reduce:transition-none ${
              role === null ? 'stroke-border-strong' : roleStyles[role].stroke
            } ${role === null ? 'stroke-2' : 'stroke-4'}`}
          />
        );
      })}

      <g data-testid="terminal" transform={`translate(${layout.terminal.x} ${layout.terminal.y})`}>
        <rect
          width={terminalW}
          height={terminalH}
          rx="8"
          fill="none"
          strokeDasharray="5 4"
          className="stroke-border-strong stroke-2"
        />
        <text
          x={terminalW / 2}
          y={terminalH / 2 + 5}
          textAnchor="middle"
          className="fill-muted font-mono text-[14px]"
        >
          null
        </text>
        {headId === null && (
          <Pill x={(terminalW - 40) / 2} y={terminalH + 12} label="head" emphasized={false} />
        )}
        {state.nodes.length === 0 && (
          <text
            x={terminalW / 2}
            y={terminalH + 48}
            textAnchor="middle"
            className="fill-muted text-[12px]"
          >
            Lista vazia
          </text>
        )}
      </g>

      {layout.trayLabel !== null && (
        <text
          x={layout.trayLabel.x}
          y={layout.trayLabel.y}
          className={`${HALO} fill-muted stroke-[3px] text-[12px]`}
          data-testid="tray-label"
        >
          Nós soltos (ainda fora da lista ou já desligados)
        </text>
      )}

      {layout.nodes.map((placed) => (
        <NodeView
          key={placed.node.id}
          placed={placed}
          roles={roles.get(placed.node.id) ?? []}
          isHead={placed.node.id === headId}
          isTail={placed.node.id === tailId}
        />
      ))}
    </svg>
  );
}

function Pill({
  x,
  y,
  label,
  emphasized,
}: {
  x: number;
  y: number;
  label: string;
  emphasized: boolean;
}) {
  return (
    <g transform={`translate(${x} ${y})`} data-pointer={label}>
      <rect
        width="40"
        height="18"
        rx="9"
        className={`fill-raised-2 ${emphasized ? 'stroke-accent stroke-2' : 'stroke-border-strong'}`}
      />
      <text x="20" y="13" textAnchor="middle" className="fill-text font-mono text-[11px] font-bold">
        {label}
      </text>
    </g>
  );
}

function NodeView({
  placed,
  roles,
  isHead,
  isTail,
}: {
  placed: PlacedNode;
  roles: readonly HighlightRole[];
  isHead: boolean;
  isTail: boolean;
}) {
  const { node, x, y } = placed;
  const dominant = dominantRole(roles);
  const removed = roles.includes('removed');
  const markers = roles
    .map((role) => ({ role, label: roleStyles[role].label }))
    .filter((m): m is { role: HighlightRole; label: string } => m.label !== null);
  const stroke = dominant === null ? 'stroke-border-strong' : roleStyles[dominant].stroke;
  const emphasizedHead = roles.includes('head');
  const emphasizedTail = roles.includes('tail');
  const pills: { label: string; emphasized: boolean }[] = [];
  if (isHead) pills.push({ label: 'head', emphasized: emphasizedHead });
  if (isTail) pills.push({ label: 'tail', emphasized: emphasizedTail });

  return (
    <g
      transform={`translate(${x} ${y})`}
      data-node-id={node.id}
      data-value={node.value}
      data-zone={placed.zone}
      data-roles={roles.join(' ')}
      className="animate-appear"
    >
      <rect
        width={nodeW}
        height={nodeH}
        rx="10"
        className={`fill-raised transition-[stroke] duration-200 motion-reduce:transition-none ${stroke} ${
          dominant === null ? 'stroke-2' : 'stroke-4'
        }`}
      />
      <line x1={valueW} y1="0" x2={valueW} y2={nodeH} className="stroke-border-strong stroke-1" />
      <text
        x={valueW / 2}
        y={nodeH / 2 + 8}
        textAnchor="middle"
        className="fill-text font-mono text-[24px] font-bold"
      >
        {node.value}
      </text>
      {node.next === null ? (
        <line
          x1={valueW + 8}
          y1={nodeH - 10}
          x2={nodeW - 8}
          y2="10"
          className="stroke-muted stroke-2"
          data-null-pointer
        />
      ) : (
        <circle cx={valueW + POINTER_W / 2} cy={nodeH / 2} r="5" className="fill-accent" />
      )}
      {removed && (
        <line
          x1="4"
          y1={nodeH - 4}
          x2={nodeW - 4}
          y2="4"
          className="stroke-role-removed stroke-4"
        />
      )}

      {pills.map((pill, i) => (
        <Pill
          key={pill.label}
          x={4 + i * 46}
          y={nodeH + 8}
          label={pill.label}
          emphasized={pill.emphasized}
        />
      ))}
      <text
        x={nodeW / 2}
        y={nodeH + 42}
        textAnchor="middle"
        className={`${HALO} stroke-[3px] text-[12px] font-semibold ${
          dominant === null ? 'fill-muted' : roleStyles[dominant].text
        }`}
        data-marker
      >
        {markers.map((m) => m.label).join(' · ')}
      </text>
      <text
        x={nodeW / 2}
        y={nodeH + 56}
        textAnchor="middle"
        className={`${HALO} stroke-[3px] fill-faint text-[11px]`}
      >
        {`id ${node.id}`}
      </text>
    </g>
  );
}
