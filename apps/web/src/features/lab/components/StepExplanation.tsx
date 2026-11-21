import { renderMessage } from '../../../content/pt-BR/messages';
import { rejectionTitles } from '../../../content/pt-BR/problems';
import { describeResult } from '../../../content/pt-BR/results';
import { isFinished } from '../playback';
import { currentStep } from '../selectors';
import { useLab } from '../LabContext';
import { Panel } from './ui';

/** Explicação do passo atual; região viva para leitores de tela (RNF-019). */
export function StepExplanation() {
  const session = useLab((s) => s);
  const step = currentStep(session);

  return (
    <Panel id="explicacao" title="Explicação do passo">
      <div
        role="status"
        aria-live="polite"
        className="min-h-14 rounded-xl bg-raised p-3 text-text"
        data-testid="step-message"
      >
        {step === null
          ? 'Escolha uma operação e clique em Executar para ver cada passo.'
          : renderMessage(step.message)}
      </div>
    </Panel>
  );
}

/** Resultado da operação: só no último passo, para não adiantar o fim da simulação. */
export function ResultPanel() {
  const execution = useLab((s) => s.execution);
  const playback = useLab((s) => s.playback);

  let content = 'O resultado aparece no último passo.';
  let tone = 'text-muted';
  if (execution === null) {
    content = 'Nenhuma operação executada ainda.';
  } else if (isFinished(playback)) {
    if (execution.outcome === 'rejected') {
      const reason = execution.metadata.rejection;
      content = reason === null ? 'Operação recusada.' : rejectionTitles[reason];
      tone = 'text-warn';
    } else {
      content = describeResult(execution);
      tone = 'text-ok';
    }
  }

  return (
    <Panel id="resultado" title="Resultado">
      <p role="status" aria-live="polite" className={tone} data-testid="result">
        {content}
      </p>
    </Panel>
  );
}
