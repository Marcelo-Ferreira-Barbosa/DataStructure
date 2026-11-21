import { useState, type FormEvent } from 'react';
import {
  groupLabels,
  groupOrder,
  operationTexts,
  paramLabels,
  type OperationGroup,
} from '../../../content/pt-BR/operations';
import { describeProblem, problemField } from '../../../content/pt-BR/problems';
import { buildOperation } from '../operation-input';
import { useLab, useLabActions } from '../LabContext';
import { Panel, errorClass, fieldClass, hintClass, labelClass, primaryButton } from './ui';

function textFor(type: string): { label: string; group: OperationGroup } | null {
  return Object.hasOwn(operationTexts, type)
    ? operationTexts[type as keyof typeof operationTexts]
    : null;
}

export function OperationPanel() {
  const actions = useLabActions();
  const descriptor = useLab((s) => s.descriptor);
  const feedback = useLab((s) => s.feedback);
  const [type, setType] = useState(descriptor.operations[0]?.type ?? '');
  const [fields, setFields] = useState<Record<string, string>>({});

  const selected = descriptor.operations.find((op) => op.type === type);
  const problems = feedback?.source === 'operation' ? feedback.problems : [];

  function submit(event: FormEvent): void {
    event.preventDefault();
    if (selected === undefined) return;
    actions.runOperation(buildOperation(selected, fields));
  }

  return (
    <Panel id="operacoes" title="Operações">
      <form onSubmit={submit} noValidate>
        <label htmlFor="op-tipo" className={labelClass}>
          Operação
        </label>
        <select
          id="op-tipo"
          className={fieldClass}
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            actions.clearFeedback();
          }}
        >
          {groupOrder.map((group) => (
            <optgroup key={group} label={groupLabels[group]}>
              {descriptor.operations
                .filter((op) => textFor(op.type)?.group === group)
                .map((op) => (
                  <option key={op.type} value={op.type}>
                    {textFor(op.type)?.label ?? op.type}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>

        {selected?.params.map((param) => {
          const fieldProblems = problems.filter((p) => problemField(p) === param.name);
          const id = `op-${param.name}`;
          return (
            <div key={param.name} className="mt-3">
              <label htmlFor={id} className={labelClass}>
                {paramLabels[param.role]}
              </label>
              <input
                id={id}
                name={param.name}
                className={fieldClass}
                inputMode="numeric"
                autoComplete="off"
                value={fields[param.name] ?? ''}
                aria-invalid={fieldProblems.length > 0}
                aria-describedby={`${id}-ajuda ${id}-erro`}
                onChange={(e) => {
                  setFields({ ...fields, [param.name]: e.target.value });
                }}
              />
              <p id={`${id}-ajuda`} className={hintClass}>
                De {param.min} a {param.max}.
              </p>
              <div id={`${id}-erro`} role="alert">
                {fieldProblems.map((problem, i) => (
                  <p key={i} className={errorClass}>
                    {describeProblem(problem)}
                  </p>
                ))}
              </div>
            </div>
          );
        })}

        {feedback?.source === 'precondition' && (
          <p role="alert" className={errorClass}>
            Esta operação não pode ser executada no estado atual da lista.
          </p>
        )}

        <button type="submit" className={`${primaryButton} mt-4 w-full`}>
          Executar
        </button>
      </form>
    </Panel>
  );
}
