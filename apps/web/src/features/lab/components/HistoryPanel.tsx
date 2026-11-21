import type { Execution } from '@dss/engine';
import { operationLabel } from '../../../content/pt-BR/operations';
import { useLab } from '../LabContext';
import { Panel } from './ui';

const ARG_LABELS: Readonly<Record<string, string>> = { value: 'valor', position: 'posição' };

function describeOperation(execution: Execution): string {
  const args = Object.entries(execution.operation as unknown as Record<string, unknown>)
    .filter(([name]) => name !== 'type')
    .map(([name, value]) => `${ARG_LABELS[name] ?? name} ${String(value)}`);
  const label = operationLabel(execution.operationName);
  return args.length === 0 ? label : `${label} (${args.join(', ')})`;
}

/** Registro de TODAS as operações, inclusive as recusadas (RF-013). Não é atalho. */
export function HistoryPanel() {
  const history = useLab((s) => s.history);
  const shown = useLab((s) => s.execution);

  return (
    <Panel id="historico" title="Histórico">
      {history.length === 0 ? (
        <p className="text-muted">As operações executadas aparecem aqui.</p>
      ) : (
        <ol className="space-y-2">
          {history.map((entry) => {
            const { execution } = entry;
            const rejected = execution.outcome === 'rejected';
            return (
              <li
                key={entry.id}
                aria-current={execution === shown ? 'true' : undefined}
                className={`rounded-xl bg-raised p-2 text-sm ${
                  execution === shown ? 'border border-accent' : 'border border-transparent'
                }`}
              >
                <span className="font-medium">
                  {entry.id}. {describeOperation(execution)}
                </span>
                <span className={`block ${rejected ? 'text-warn' : 'text-ok'}`}>
                  {rejected ? '⚠ recusada' : '✓ concluída'}
                  {execution === shown ? ' · em exibição' : ''}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </Panel>
  );
}
