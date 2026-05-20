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
import type {
  CursorState,
  PlainTextEditorState,
  RemoteOperationEvent,
  TextOp,
} from '../types/editor.types';

export interface PlainTextEditorSurfaceProps {
  canWrite: boolean;
  content: string;
  contentSerial: number;
  markRemoteApplied: PlainTextEditorState['markRemoteApplied'];
  remoteCursors: CursorState[];
  remoteOperation: RemoteOperationEvent | null;
  sendCursor: PlainTextEditorState['sendCursor'];
  sendLocalOperation: PlainTextEditorState['sendLocalOperation'];
}

export function PlainTextEditorSurface({
  canWrite,
  content,
  contentSerial,
  markRemoteApplied,
  remoteCursors,
  remoteOperation,
  sendCursor,
  sendLocalOperation,
}: PlainTextEditorSurfaceProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const applyingRemoteRef = useRef(false);
  const appliedContentSerialRef = useRef(-1);
  const appliedRemoteEventRef = useRef<string | null>(null);
  const editableCompartmentRef = useRef(new Compartment());
  const sendCursorRef = useRef(sendCursor);
  const sendLocalOperationRef = useRef(sendLocalOperation);

  useEffect(() => {
    sendCursorRef.current = sendCursor;
    sendLocalOperationRef.current = sendLocalOperation;
  }, [sendCursor, sendLocalOperation]);

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
          editableCompartmentRef.current.of(EditorView.editable.of(canWrite)),
          EditorView.theme({
            '&': {
              backgroundColor: '#ffffff',
              color: '#0f172a',
              fontSize: '14px',
              minHeight: '100%',
            },
            '.cm-content': {
              caretColor: '#0f766e',
              fontFamily:
                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
              lineHeight: '1.7',
              minHeight: '100%',
              padding: '1.5rem 1.75rem',
            },
            '&.cm-focused': {
              outline: 'none',
            },
            '.cm-gutters': {
              backgroundColor: '#f8fafc',
              borderRightColor: '#e2e8f0',
              color: '#94a3b8',
              fontFamily:
                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
              fontSize: '12px',
            },
            '.cm-activeLine': {
              backgroundColor: 'rgba(14, 165, 233, 0.06)',
            },
            '.cm-activeLineGutter': {
              backgroundColor: 'rgba(14, 165, 233, 0.08)',
              color: '#475569',
            },
            '.cm-lineNumbers .cm-gutterElement': {
              paddingLeft: '0.75rem',
              paddingRight: '0.75rem',
            },
            '.cm-scroller': {
              minHeight: '100%',
            },
            '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
              backgroundColor: 'rgba(59, 130, 246, 0.22)',
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
      effects: editableCompartmentRef.current.reconfigure(EditorView.editable.of(canWrite)),
    });
  }, [canWrite]);

  useEffect(() => {
    const view = viewRef.current;

    if (!view || appliedContentSerialRef.current === contentSerial) {
      return;
    }

    appliedContentSerialRef.current = contentSerial;
    applyingRemoteRef.current = true;
    view.dispatch({
      changes: {
        from: 0,
        insert: content,
        to: view.state.doc.length,
      },
    });
    applyingRemoteRef.current = false;
  }, [content, contentSerial]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view || !remoteOperation || appliedRemoteEventRef.current === remoteOperation.id) {
      return;
    }

    appliedRemoteEventRef.current = remoteOperation.id;
    applyingRemoteRef.current = true;
    applyRemoteOperation(view, remoteOperation.op);
    applyingRemoteRef.current = false;
    markRemoteApplied(remoteOperation.id);
  }, [markRemoteApplied, remoteOperation]);

  useEffect(() => {
    const view = viewRef.current;

    if (!view) {
      return;
    }

    view.dispatch({
      effects: setRemoteCursorsEffect.of(remoteCursors),
    });
  }, [remoteCursors]);

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
