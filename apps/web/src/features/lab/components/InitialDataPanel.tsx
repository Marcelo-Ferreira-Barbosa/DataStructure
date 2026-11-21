import { LIMITS } from '@dss/engine';
import { useState, type FormEvent } from 'react';
import { describeProblem, problemItem } from '../../../content/pt-BR/problems';
import { parseValues } from '../operation-input';
import { useLab, useLabActions } from '../LabContext';
import {
  Panel,
  errorClass,
  fieldClass,
  hintClass,
  labelClass,
  primaryButton,
  secondaryButton,
} from './ui';

export function InitialDataPanel() {
  const actions = useLabActions();
  const feedback = useLab((s) => s.feedback);
  const seed = useLab((s) => s.seed);
  const hasHistory = useLab((s) => s.history.length > 0);
  const [text, setText] = useState('4, 8, 15');
  const [count, setCount] = useState('6');
  const [seedText, setSeedText] = useState(String(seed));

  const problems = feedback?.source === 'list' ? feedback.problems : [];

  function submit(event: FormEvent): void {
    event.preventDefault();
    actions.createList(parseValues(text));
  }

  return (
    <Panel id="dados" title="Dados iniciais">
      <form onSubmit={submit} noValidate>
        <label htmlFor="dados-valores" className={labelClass}>
          Valores da lista, separados por vírgula
        </label>
        <input
          id="dados-valores"
          className={fieldClass}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
          }}
          aria-describedby="dados-ajuda dados-erros"
          aria-invalid={problems.some((p) => p.path.startsWith('values'))}
          inputMode="numeric"
          autoComplete="off"
        />
        <p id="dados-ajuda" className={hintClass}>
          Até {LIMITS.maxElements} valores, cada um de {LIMITS.minValue} a {LIMITS.maxValue}. Vazio
          cria uma lista vazia.
        </p>
        <div id="dados-erros" role="alert">
          {problems.map((problem, i) => {
            const item = problemItem(problem);
            return (
              <p key={`${problem.path}-${i}`} className={errorClass}>
                {item === null ? '' : `Valor ${item}: `}
                {describeProblem(problem)}
              </p>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="submit" className={primaryButton}>
            Criar lista
          </button>
          <button type="button" className={secondaryButton} onClick={actions.loadExample}>
            Exemplo
          </button>
        </div>
      </form>

      <form
        className="mt-4 border-t border-border pt-4"
        onSubmit={(e) => {
          e.preventDefault();
          actions.createRandomList(Number(count), Number(seedText));
        }}
        noValidate
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="dados-tamanho" className={labelClass}>
              Tamanho
            </label>
            <input
              id="dados-tamanho"
              className={fieldClass}
              inputMode="numeric"
              value={count}
              onChange={(e) => {
                setCount(e.target.value);
              }}
            />
          </div>
          <div>
            <label htmlFor="dados-semente" className={labelClass}>
              Semente
            </label>
            <input
              id="dados-semente"
              className={fieldClass}
              inputMode="numeric"
              value={seedText}
              onChange={(e) => {
                setSeedText(e.target.value);
              }}
            />
          </div>
        </div>
        <p className={hintClass}>A mesma semente e o mesmo tamanho repetem a mesma lista.</p>
        <button type="submit" className={`${secondaryButton} mt-3`}>
          Lista aleatória
        </button>
      </form>

      {hasHistory && (
        <p className={hintClass}>Criar uma nova lista apaga o histórico de operações.</p>
      )}
    </Panel>
  );
}
