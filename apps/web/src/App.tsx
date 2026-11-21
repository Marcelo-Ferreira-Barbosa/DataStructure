import { ENGINE_REVISION } from '@dss/engine';
import { LabPage } from './features/lab/LabPage';
import { LabProvider } from './features/lab/LabContext';

export function App() {
  return (
    <LabProvider>
      <main>
        <LabPage />
      </main>
      <footer className="mx-auto max-w-[1600px] px-4 pb-6 text-sm text-faint">
        DataStructure Studio · Engine rev. {ENGINE_REVISION}
      </footer>
    </LabProvider>
  );
}
