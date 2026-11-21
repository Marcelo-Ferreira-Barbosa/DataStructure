import {
  counterLabels,
  complexityDisclaimer,
  complexityNote,
} from '../../../content/pt-BR/complexity';
import { currentStep } from '../selectors';
import { useLab } from '../LabContext';
import { Panel } from './ui';

/** Contadores ACUMULADOS até o passo atual (acompanham o cursor, não o fim). */
export function CountersPanel() {
  const session = useLab((s) => s);
  const counters = currentStep(session)?.counters ?? null;

  return (
    <Panel id="contadores" title="Contadores até este passo">
      <dl className="grid grid-cols-3 gap-2 text-center">
        {(Object.keys(counterLabels) as (keyof typeof counterLabels)[]).map((key) => (
          <div key={key} className="rounded-xl bg-raised p-2">
            <dt className="text-xs text-muted">{counterLabels[key]}</dt>
            <dd className="font-mono text-2xl font-bold" data-testid={`counter-${key}`}>
              {counters === null ? '—' : counters[key]}
            </dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}

export function ComplexityPanel() {
  const execution = useLab((s) => s.execution);

  return (
    <Panel id="complexidade" title="Complexidade da operação">
      {execution === null ? (
        <p className="text-muted">Execute uma operação para ver a complexidade.</p>
      ) : (
        <>
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Complexidade de {execution.operationName}</caption>
            <thead>
              <tr className="text-muted">
                <th scope="col" className="py-1 font-medium">
                  Melhor
                </th>
                <th scope="col" className="py-1 font-medium">
                  Médio
                </th>
                <th scope="col" className="py-1 font-medium">
                  Pior
                </th>
                <th scope="col" className="py-1 font-medium">
                  Espaço
                </th>
              </tr>
            </thead>
            <tbody className="font-mono" data-testid="complexity-row">
              <tr>
                <td className="py-1">{execution.complexity.time.best}</td>
                <td className="py-1">{execution.complexity.time.average}</td>
                <td className="py-1">{execution.complexity.time.worst}</td>
                <td className="py-1">{execution.complexity.space}</td>
              </tr>
            </tbody>
          </table>
          {complexityNote(execution.operationName) !== null && (
            <p className="mt-2 text-sm text-muted">{complexityNote(execution.operationName)}</p>
          )}
          <p className="mt-2 text-sm text-faint">{complexityDisclaimer}</p>
        </>
      )}
    </Panel>
  );
}
