import { Badge } from '../../../shared/components';
import type { PlainTextEditorState } from '../types/editor.types';
import { PlainTextContextSidebar } from './PlainTextContextSidebar';
import { PlainTextEditorSurface } from './PlainTextEditorSurface';

export interface PlainTextEditorLayoutProps {
  state: PlainTextEditorState;
}

export function PlainTextEditorLayout({ state }: PlainTextEditorLayoutProps): JSX.Element {
  return (
    <section aria-label="Plain text collaborative editor" className="plaintext-editor-page">
      <PlainTextContextSidebar state={state} />

      <main className="plaintext-editor-main">
        {state.error ? (
          <div className="plaintext-error" role="alert">
            {state.error}
          </div>
        ) : null}
        <div className="plaintext-editor-toolbar">
          <div>
            <p className="m-0 text-sm font-semibold text-slate-950">Collaborative plain text</p>
            <p className="m-0 text-xs text-slate-500">
              WebSocket OT transport at document version {state.version}
            </p>
          </div>
          <Badge variant={state.canWrite ? 'success' : 'default'}>
            {state.canWrite ? 'Editable' : 'Read only'}
          </Badge>
        </div>
        <PlainTextEditorSurface state={state} />
      </main>
    </section>
  );
}
