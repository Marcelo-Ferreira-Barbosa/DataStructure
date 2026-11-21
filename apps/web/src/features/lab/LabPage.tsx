import { LIMITS } from '@dss/engine';
import { ListVisualizer } from '../visualizers/linked-list/ListVisualizer';
import { CountersPanel, ComplexityPanel } from './components/CountersPanel';
import { HistoryPanel } from './components/HistoryPanel';
import { InitialDataPanel } from './components/InitialDataPanel';
import { OperationPanel } from './components/OperationPanel';
import { PlaybackControls } from './components/PlaybackControls';
import { PseudocodePanel } from './components/PseudocodePanel';
import { ResultPanel, StepExplanation } from './components/StepExplanation';
import { Panel } from './components/ui';
import { useAutoplay, useLab } from './LabContext';
import { currentStep, displayedState } from './selectors';

export function LabPage() {
  useAutoplay();
  const session = useLab((s) => s);
  const step = currentStep(session);
  const feedback = session.feedback;

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">Lista simplesmente encadeada</h1>
        <p className="mt-1 text-muted">
          Execute operações e acompanhe cada passo: nós, ponteiros, pseudocódigo e contadores.
        </p>
        <p className="mt-2 inline-block rounded-full bg-raised px-3 py-1 text-sm text-muted">
          Até {LIMITS.maxElements} nós · valores de {LIMITS.minValue} a {LIMITS.maxValue}
        </p>
      </header>

      {feedback?.source === 'internal' && (
        <p role="alert" className="mb-4 rounded-xl border border-err bg-raised p-3 text-err">
          Algo inesperado aconteceu na simulação ({feedback.message}). A lista foi mantida como
          estava.
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)_minmax(0,23rem)]">
        <div className="order-2 grid min-w-0 content-start gap-4 lg:order-none">
          <InitialDataPanel />
          <OperationPanel />
          <HistoryPanel />
        </div>

        <div className="order-1 grid min-w-0 content-start gap-4 lg:order-none">
          <Panel id="visualizacao" title="Visualização">
            <ListVisualizer state={displayedState(session)} highlights={step?.highlights ?? []} />
          </Panel>
          <PlaybackControls />
          <StepExplanation />
          <ResultPanel />
        </div>

        <div className="order-3 grid min-w-0 content-start gap-4 lg:order-none">
          <PseudocodePanel />
          <CountersPanel />
          <ComplexityPanel />
        </div>
      </div>
    </div>
  );
}
