import { useEffect, useRef } from 'react';
import { basicSetup } from 'codemirror';
import { Compartment, EditorState } from '@codemirror/state';
import { EditorView, type ViewUpdate } from '@codemirror/view';

import {
  codePointLength,
  codePointOffsetToCodeUnitOffset,
  codeUnitOffsetToCodePointOffset,
  hashText,
} from '../utils/otTransform';
import { remoteCursorField, setRemoteCursorsEffect } from '../extensions/remoteCursorExtension';
import type { PlainTextEditorState, TextOp } from '../types/editor.types';

export interface PlainTextEditorSurfaceProps {
  state: PlainTextEditorState;
}

export function PlainTextEditorSurface({ state }: PlainTextEditorSurfaceProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const applyingRemoteRef = useRef(false);
  const appliedContentSerialRef = useRef(-1);
  const appliedRemoteEventRef = useRef<string | null>(null);
  const editableCompartmentRef = useRef(new Compartment());
  const sendCursorRef = useRef(state.sendCursor);
  const sendLocalOperationRef = useRef(state.sendLocalOperation);

  useEffect(() => {
    sendCursorRef.current = state.sendCursor;
    sendLocalOperationRef.current = state.sendLocalOperation;
  }, [state.sendCursor, state.sendLocalOperation]);

  useEffect(() => {
    const container = containerRef.current;

    if (!container || viewRef.current) {
      return undefined;
    }

    const view = new EditorView({
      parent: container,
      state: EditorState.create({
        doc: '',
        extensions: [
          basicSetup,
          remoteCursorField,
          EditorView.lineWrapping,
          editableCompartmentRef.current.of(EditorView.editable.of(state.canWrite)),
          EditorView.theme({
            '&': {
              backgroundColor: '#ffffff',
              color: '#17202a',
              fontSize: '15px',
              minHeight: '100%',
            },
            '.cm-content': {
              caretColor: '#0f766e',
              fontFamily:
                'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
              lineHeight: '1.65',
              minHeight: '100%',
              padding: '2rem',
            },
            '.cm-focused': {
              outline: 'none',
            },
            '.cm-gutters': {
              backgroundColor: '#f8fafc',
              borderRightColor: '#e2e8f0',
              color: '#64748b',
            },
            '.cm-scroller': {
              minHeight: '100%',
            },
          }),
          EditorView.updateListener.of((update) => {
            if (applyingRemoteRef.current) {
              return;
            }

            if (update.docChanged) {
              emitLocalOperations(update, sendLocalOperationRef.current);
            }

            if (update.docChanged || update.selectionSet) {
              emitCursor(update, sendCursorRef.current);
            }
          }),
        ],
      }),
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  useEffect(() => {
    const view = viewRef.current;

    if (!view) {
      return;
    }

    view.dispatch({
      effects: editableCompartmentRef.current.reconfigure(EditorView.editable.of(state.canWrite)),
    });
  }, [state.canWrite]);

  useEffect(() => {
    const view = viewRef.current;

    if (!view || appliedContentSerialRef.current === state.contentSerial) {
      return;
    }

    appliedContentSerialRef.current = state.contentSerial;
    applyingRemoteRef.current = true;
    view.dispatch({
      changes: {
        from: 0,
        insert: state.content,
        to: view.state.doc.length,
      },
    });
    applyingRemoteRef.current = false;
  }, [state.content, state.contentSerial]);

  useEffect(() => {
    const view = viewRef.current;
    const remoteOperation = state.remoteOperation;

    if (!view || !remoteOperation || appliedRemoteEventRef.current === remoteOperation.id) {
      return;
    }

    appliedRemoteEventRef.current = remoteOperation.id;
    applyingRemoteRef.current = true;
    applyRemoteOperation(view, remoteOperation.op);
    applyingRemoteRef.current = false;
    state.markRemoteApplied(remoteOperation.id);
  }, [state, state.remoteOperation]);

  useEffect(() => {
    const view = viewRef.current;

    if (!view) {
      return;
    }

    view.dispatch({
      effects: setRemoteCursorsEffect.of(state.remoteCursors),
    });
  }, [state.remoteCursors]);

  return (
    <div
      aria-label="Plain text collaborative editor"
      className="plaintext-editor-surface"
      ref={containerRef}
    />
  );
}

function emitLocalOperations(
  update: ViewUpdate,
  sendLocalOperation: PlainTextEditorState['sendLocalOperation'],
): void {
  const before = update.startState.doc.toString();
  const after = update.state.doc.toString();
  const clientHash = hashText(after);
  let positionDelta = 0;

  update.changes.iterChanges((fromA, toA, _fromB, _toB, inserted) => {
    const deletedText = before.slice(fromA, toA);
    const insertedText = inserted.toString();
    const basePosition = codeUnitOffsetToCodePointOffset(before, fromA) + positionDelta;
    const deletedLength = codePointLength(deletedText);
    const insertedLength = codePointLength(insertedText);

    if (deletedLength > 0) {
      sendLocalOperation({ len: deletedLength, pos: basePosition, type: 'delete' }, clientHash);
    }

    if (insertedText.length > 0) {
      sendLocalOperation({ pos: basePosition, text: insertedText, type: 'insert' }, clientHash);
    }

    positionDelta += insertedLength - deletedLength;
  });
}

function emitCursor(
  update: ViewUpdate,
  sendCursor: PlainTextEditorState['sendCursor'],
): void {
  const content = update.state.doc.toString();
  const selection = update.state.selection.main;

  sendCursor({
    pos: codeUnitOffsetToCodePointOffset(content, selection.head),
    selectionEnd: codeUnitOffsetToCodePointOffset(content, selection.to),
    selectionStart: codeUnitOffsetToCodePointOffset(content, selection.from),
  });
}

function applyRemoteOperation(view: EditorView, op: TextOp): void {
  const content = view.state.doc.toString();
  const from = codePointOffsetToCodeUnitOffset(content, op.pos);

  if (op.type === 'insert') {
    view.dispatch({
      changes: {
        from,
        insert: op.text,
      },
    });
    return;
  }

  view.dispatch({
    changes: {
      from,
      to: codePointOffsetToCodeUnitOffset(content, op.pos + op.len),
    },
  });
}
