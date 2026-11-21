import { canGoBack, canGoForward, isFinished, SPEEDS, type Speed } from '../playback';
import { useLab, useLabActions } from '../LabContext';
import { EndIcon, NextIcon, PauseIcon, PlayIcon, PreviousIcon, RestartIcon } from './icons';
import { Panel, secondaryButton, primaryButton } from './ui';

export function PlaybackControls() {
  const { dispatch, setSpeed } = useLabActions();
  const playback = useLab((s) => s.playback);
  const none = playback.stepCount === 0;
  const playing = playback.status === 'playing';
  const finished = isFinished(playback);

  const playLabel = playing ? 'Pausar' : finished ? 'Repetir' : 'Reproduzir';

  return (
    <Panel id="controles" title="Simulação">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={secondaryButton}
          aria-label="Reiniciar simulação"
          disabled={none}
          onClick={() => {
            dispatch({ type: 'restart' });
          }}
        >
          <RestartIcon />
        </button>
        <button
          type="button"
          className={secondaryButton}
          aria-label="Passo anterior"
          disabled={!canGoBack(playback)}
          onClick={() => {
            dispatch({ type: 'previous' });
          }}
        >
          <PreviousIcon />
        </button>
        <button
          type="button"
          className={primaryButton}
          aria-label={playLabel}
          disabled={none}
          onClick={() => {
            dispatch({ type: playing ? 'pause' : 'play' });
          }}
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
          <span aria-hidden="true">{playLabel}</span>
        </button>
        <button
          type="button"
          className={secondaryButton}
          aria-label="Próximo passo"
          disabled={!canGoForward(playback)}
          onClick={() => {
            dispatch({ type: 'next' });
          }}
        >
          <NextIcon />
        </button>
        <button
          type="button"
          className={secondaryButton}
          aria-label="Ir ao último passo"
          disabled={!canGoForward(playback)}
          onClick={() => {
            dispatch({ type: 'last' });
          }}
        >
          <EndIcon />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <label htmlFor="passo-barra" className="mb-1 block text-sm text-muted">
            {none ? 'Passo' : `Passo ${playback.cursor + 1} de ${playback.stepCount}`}
          </label>
          <input
            id="passo-barra"
            type="range"
            className="min-h-11 w-full accent-accent"
            min={1}
            max={Math.max(playback.stepCount, 1)}
            value={none ? 1 : playback.cursor + 1}
            disabled={none}
            aria-valuetext={
              none ? undefined : `Passo ${playback.cursor + 1} de ${playback.stepCount}`
            }
            onChange={(e) => {
              dispatch({ type: 'seek', index: Number(e.target.value) - 1 });
            }}
          />
        </div>
        <div>
          <label htmlFor="passo-velocidade" className="mb-1 block text-sm text-muted">
            Velocidade
          </label>
          <select
            id="passo-velocidade"
            className="min-h-11 rounded-[10px] border border-border-strong bg-raised px-3 text-text"
            value={playback.speed}
            onChange={(e) => {
              setSpeed(Number(e.target.value) as Speed);
            }}
          >
            {SPEEDS.map((speed) => (
              <option key={speed} value={speed}>
                {speed}×
              </option>
            ))}
          </select>
        </div>
      </div>
    </Panel>
  );
}
