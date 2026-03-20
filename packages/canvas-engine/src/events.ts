import type { DesignDocument } from '@design-editor/common-types';

export const CANVAS_DOCUMENT_CHANGED_EVENT = 'canvas:document-changed';
export const CANVAS_RENDERED_EVENT = 'canvas:rendered';

export type CanvasDocumentChangedDetail = {
  document: DesignDocument;
  source: 'store' | 'renderer' | 'initial-load';
};

export type CanvasRenderedDetail = {
  documentId: string | null;
  elementCount: number;
  durationMs: number;
  renderCount: number;
};

export type CanvasEventMap = {
  [CANVAS_DOCUMENT_CHANGED_EVENT]: CanvasDocumentChangedDetail;
  [CANVAS_RENDERED_EVENT]: CanvasRenderedDetail;
};

type CanvasEventName = keyof CanvasEventMap;
type CanvasEventHandler<TEventName extends CanvasEventName> = (
  detail: CanvasEventMap[TEventName],
) => void;

function dispatchCanvasEvent<TEventName extends CanvasEventName>(
  target: EventTarget,
  type: TEventName,
  detail: CanvasEventMap[TEventName],
): boolean {
  return target.dispatchEvent(new CustomEvent(type, { detail }));
}

function subscribeCanvasEvent<TEventName extends CanvasEventName>(
  target: EventTarget,
  type: TEventName,
  handler: CanvasEventHandler<TEventName>,
): () => void {
  const listener: EventListener = (event) => {
    handler((event as CustomEvent<CanvasEventMap[TEventName]>).detail);
  };

  target.addEventListener(type, listener);

  return () => {
    target.removeEventListener(type, listener);
  };
}

export function dispatchDocumentChanged(
  target: EventTarget,
  document: DesignDocument,
  source: CanvasDocumentChangedDetail['source'] = 'store',
): boolean {
  return dispatchCanvasEvent(target, CANVAS_DOCUMENT_CHANGED_EVENT, {
    document,
    source,
  });
}

export function onDocumentChanged(
  target: EventTarget,
  handler: CanvasEventHandler<typeof CANVAS_DOCUMENT_CHANGED_EVENT>,
): () => void {
  return subscribeCanvasEvent(target, CANVAS_DOCUMENT_CHANGED_EVENT, handler);
}

export function dispatchCanvasRendered(
  target: EventTarget,
  detail: CanvasRenderedDetail,
): boolean {
  return dispatchCanvasEvent(target, CANVAS_RENDERED_EVENT, detail);
}

export function onCanvasRendered(
  target: EventTarget,
  handler: CanvasEventHandler<typeof CANVAS_RENDERED_EVENT>,
): () => void {
  return subscribeCanvasEvent(target, CANVAS_RENDERED_EVENT, handler);
}
