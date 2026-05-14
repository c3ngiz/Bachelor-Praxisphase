import { AppProviders } from './providers';
import { AppRouter } from './routes';

/** Root application component that wires providers and routing. */
export function App(): JSX.Element {
  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  );
}
