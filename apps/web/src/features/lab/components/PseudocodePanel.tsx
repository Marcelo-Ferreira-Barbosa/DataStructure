import { pseudocodeFor } from '../../../content/pt-BR/pseudocode';
import { currentStep } from '../selectors';
import { useLab } from '../LabContext';
import { Panel } from './ui';

export function PseudocodePanel() {
  const session = useLab((s) => s);
  const step = currentStep(session);
  const block =
    session.execution === null
      ? null
      : pseudocodeFor(step?.anchor ?? null, session.execution.operationName);

  return (
    <Panel id="pseudocodigo" title="Pseudocódigo">
      {block === null ? (
        <p className="text-muted">Execute uma operação para ver o pseudocódigo.</p>
      ) : (
        <>
          <p className="mb-2 font-mono text-sm text-accent-text">{block.title}</p>
          <ol
            // Rolagem só como segurança: as linhas são escritas para caber (≤ 36 caracteres).
            className="overflow-x-auto rounded-xl bg-raised py-2 font-mono text-sm"
            tabIndex={0}
            aria-label="Linhas do pseudocódigo"
          >
            {block.lines.map((line, i) => {
              const active = line.anchor !== null && line.anchor === step?.anchor;
              return (
                <li
                  key={i}
                  aria-current={active ? 'step' : undefined}
                  data-active={active}
                  className={`flex gap-3 whitespace-pre border-l-4 px-3 py-0.5 ${
                    active
                      ? 'border-accent bg-code-current text-text'
                      : 'border-transparent text-muted'
                  }`}
                >
                  <span className="w-5 shrink-0 text-right text-faint" aria-hidden="true">
                    {i + 1}
                  </span>
                  <span>{line.text}</span>
                </li>
              );
            })}
          </ol>
        </>
      )}
    </Panel>
  );
}
