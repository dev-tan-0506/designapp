import { describe, expect, it, vi } from 'vitest';

import {
  dispatchCanvasRendered,
  dispatchDocumentChanged,
  onCanvasRendered,
  onDocumentChanged,
} from './events';
import type { DesignDocument } from '@design-editor/common-types';

const documentFixture: DesignDocument = {
  id: 'doc-events',
  name: 'Events',
  canvas: {
    width: 1200,
    height: 800,
    backgroundColor: '#ffffff',
  },
  elements: [],
  selectedElementIds: [],
  updatedAt: '2026-03-20T00:00:00.000Z',
};

describe('canvas events', () => {
  it('dispatches and receives document changed events through typed helpers', () => {
    const target = new EventTarget();
    const handler = vi.fn();
    const unsubscribe = onDocumentChanged(target, handler);

    dispatchDocumentChanged(target, documentFixture, 'store');

    expect(handler).toHaveBeenCalledWith({
      document: documentFixture,
      source: 'store',
    });

    unsubscribe();
    dispatchDocumentChanged(target, documentFixture, 'renderer');

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('dispatches render metrics through typed helpers', () => {
    const target = new EventTarget();
    const handler = vi.fn();

    onCanvasRendered(target, handler);
    dispatchCanvasRendered(target, {
      documentId: 'doc-events',
      elementCount: 12,
      durationMs: 4,
      renderCount: 3,
    });

    expect(handler).toHaveBeenCalledWith({
      documentId: 'doc-events',
      elementCount: 12,
      durationMs: 4,
      renderCount: 3,
    });
  });
});
