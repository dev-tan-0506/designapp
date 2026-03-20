import type { CanvasPoint, CanvasSize } from '@design-editor/common-types';

export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 8;

export type ViewportState = {
  zoom: number;
  pan: CanvasPoint;
  stageSize: CanvasSize;
};

export function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

export function sanitizeStageSize(stageSize: CanvasSize): CanvasSize {
  return {
    width: Math.max(1, Math.floor(stageSize.width)),
    height: Math.max(1, Math.floor(stageSize.height)),
  };
}

export function screenToCanvasPoint(viewport: ViewportState, screenPoint: CanvasPoint): CanvasPoint {
  const zoom = clampZoom(viewport.zoom);

  return {
    x: (screenPoint.x - viewport.pan.x) / zoom,
    y: (screenPoint.y - viewport.pan.y) / zoom,
  };
}

export function zoomViewportAtPoint(
  viewport: ViewportState,
  nextZoom: number,
  screenPoint: CanvasPoint,
): ViewportState {
  const zoom = clampZoom(nextZoom);
  const canvasPoint = screenToCanvasPoint(viewport, screenPoint);

  return {
    ...viewport,
    zoom,
    pan: {
      x: screenPoint.x - canvasPoint.x * zoom,
      y: screenPoint.y - canvasPoint.y * zoom,
    },
  };
}

export function fitViewportToCanvas(
  canvasSize: CanvasSize,
  stageSize: CanvasSize,
  padding = 0,
): ViewportState {
  const safeStage = sanitizeStageSize(stageSize);
  const availableWidth = Math.max(1, safeStage.width - padding * 2);
  const availableHeight = Math.max(1, safeStage.height - padding * 2);
  const zoom = Math.min(
    MAX_ZOOM,
    Math.max(
      1 / Math.max(canvasSize.width, canvasSize.height),
      Math.min(availableWidth / canvasSize.width, availableHeight / canvasSize.height),
    ),
  );

  return {
    zoom,
    pan: {
      x: (safeStage.width - canvasSize.width * zoom) / 2,
      y: (safeStage.height - canvasSize.height * zoom) / 2,
    },
    stageSize: safeStage,
  };
}
