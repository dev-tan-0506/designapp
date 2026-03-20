import type { BaseCanvasElement, CanvasBounds, CanvasPoint } from '@design-editor/common-types';

export const MIN_TRANSFORM_SIZE = 24;
export const ROTATION_SNAP_DEGREES = 15;
export const ROTATION_HANDLE_OFFSET = 32;

export type TransformHandle =
  | 'n'
  | 'e'
  | 's'
  | 'w'
  | 'ne'
  | 'nw'
  | 'se'
  | 'sw'
  | 'rotate';

export type TransformHandleDescriptor = {
  handle: TransformHandle;
  point: CanvasPoint;
  cursor: string;
};

type ResizeResult = Pick<BaseCanvasElement, 'x' | 'y' | 'width' | 'height'>;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function rotateVector(vector: CanvasPoint, degrees: number): CanvasPoint {
  const radians = toRadians(degrees);
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  return {
    x: vector.x * cos - vector.y * sin,
    y: vector.x * sin + vector.y * cos,
  };
}

function getLocalHandlePoint(
  width: number,
  height: number,
  handle: TransformHandle,
  rotationHandleOffset = ROTATION_HANDLE_OFFSET,
): CanvasPoint {
  switch (handle) {
    case 'n':
      return { x: width / 2, y: 0 };
    case 'e':
      return { x: width, y: height / 2 };
    case 's':
      return { x: width / 2, y: height };
    case 'w':
      return { x: 0, y: height / 2 };
    case 'ne':
      return { x: width, y: 0 };
    case 'nw':
      return { x: 0, y: 0 };
    case 'se':
      return { x: width, y: height };
    case 'sw':
      return { x: 0, y: height };
    case 'rotate':
      return { x: width / 2, y: -rotationHandleOffset };
  }
}

function getOppositeAnchorPoint(width: number, height: number, handle: Exclude<TransformHandle, 'rotate'>): CanvasPoint {
  switch (handle) {
    case 'n':
      return { x: width / 2, y: height };
    case 'e':
      return { x: 0, y: height / 2 };
    case 's':
      return { x: width / 2, y: 0 };
    case 'w':
      return { x: width, y: height / 2 };
    case 'ne':
      return { x: 0, y: height };
    case 'nw':
      return { x: width, y: height };
    case 'se':
      return { x: 0, y: 0 };
    case 'sw':
      return { x: width, y: 0 };
  }
}

function getWorldPointForLocalPoint(
  element: Pick<BaseCanvasElement, 'x' | 'y' | 'width' | 'height' | 'rotation'>,
  point: CanvasPoint,
): CanvasPoint {
  return rotatePoint(
    {
      x: element.x + point.x,
      y: element.y + point.y,
    },
    getElementCenter(element),
    element.rotation,
  );
}

function clampDimension(value: number, minSize: number): number {
  return Math.max(minSize, value);
}

export function normalizeRotation(degrees: number): number {
  const normalized = ((degrees + 180) % 360 + 360) % 360 - 180;

  return normalized === -180 ? 180 : normalized;
}

export function getElementCenter(
  element: Pick<BaseCanvasElement, 'x' | 'y' | 'width' | 'height'>,
): CanvasPoint {
  return {
    x: element.x + element.width / 2,
    y: element.y + element.height / 2,
  };
}

export function rotatePoint(
  point: CanvasPoint,
  center: CanvasPoint,
  degrees: number,
): CanvasPoint {
  const rotated = rotateVector(
    {
      x: point.x - center.x,
      y: point.y - center.y,
    },
    degrees,
  );

  return {
    x: center.x + rotated.x,
    y: center.y + rotated.y,
  };
}

export function screenFromCanvas(point: CanvasPoint, zoom: number, pan: CanvasPoint): CanvasPoint {
  return {
    x: point.x * zoom + pan.x,
    y: point.y * zoom + pan.y,
  };
}

export function canvasFromScreen(point: CanvasPoint, zoom: number, pan: CanvasPoint): CanvasPoint {
  return {
    x: (point.x - pan.x) / zoom,
    y: (point.y - pan.y) / zoom,
  };
}

export function getRotatedElementCorners(
  element: Pick<BaseCanvasElement, 'x' | 'y' | 'width' | 'height' | 'rotation'>,
): CanvasPoint[] {
  const center = getElementCenter(element);

  return [
    rotatePoint({ x: element.x, y: element.y }, center, element.rotation),
    rotatePoint({ x: element.x + element.width, y: element.y }, center, element.rotation),
    rotatePoint({ x: element.x + element.width, y: element.y + element.height }, center, element.rotation),
    rotatePoint({ x: element.x, y: element.y + element.height }, center, element.rotation),
  ];
}

export function getSelectionBounds(
  element: Pick<BaseCanvasElement, 'x' | 'y' | 'width' | 'height' | 'rotation'>,
): CanvasBounds {
  const corners = getRotatedElementCorners(element);
  const xs = corners.map((point) => point.x);
  const ys = corners.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export function isPointInElement(
  element: Pick<BaseCanvasElement, 'x' | 'y' | 'width' | 'height' | 'rotation'>,
  point: CanvasPoint,
): boolean {
  const center = getElementCenter(element);
  const localPoint = rotatePoint(point, center, -element.rotation);

  return (
    localPoint.x >= element.x &&
    localPoint.x <= element.x + element.width &&
    localPoint.y >= element.y &&
    localPoint.y <= element.y + element.height
  );
}

export function getTransformHandleDescriptors(
  element: Pick<BaseCanvasElement, 'x' | 'y' | 'width' | 'height' | 'rotation'>,
): TransformHandleDescriptor[] {
  const handles: Array<[TransformHandle, string]> = [
    ['nw', 'nwse-resize'],
    ['n', 'ns-resize'],
    ['ne', 'nesw-resize'],
    ['e', 'ew-resize'],
    ['se', 'nwse-resize'],
    ['s', 'ns-resize'],
    ['sw', 'nesw-resize'],
    ['w', 'ew-resize'],
    ['rotate', 'grab'],
  ];

  return handles.map(([handle, cursor]) => ({
    handle,
    cursor,
    point: getWorldPointForLocalPoint(element, getLocalHandlePoint(element.width, element.height, handle)),
  }));
}

export function resizeElementFromHandle(
  element: Pick<BaseCanvasElement, 'x' | 'y' | 'width' | 'height' | 'rotation'>,
  handle: Exclude<TransformHandle, 'rotate'>,
  pointer: CanvasPoint,
  minSize = MIN_TRANSFORM_SIZE,
): ResizeResult {
  const rotation = element.rotation;
  const anchorLocal = getOppositeAnchorPoint(element.width, element.height, handle);
  const anchorWorld = getWorldPointForLocalPoint(element, anchorLocal);
  const localDelta = rotateVector(
    {
      x: pointer.x - anchorWorld.x,
      y: pointer.y - anchorWorld.y,
    },
    -rotation,
  );

  let nextWidth = element.width;
  let nextHeight = element.height;

  switch (handle) {
    case 'e':
      nextWidth = clampDimension(localDelta.x, minSize);
      break;
    case 'w':
      nextWidth = clampDimension(-localDelta.x, minSize);
      break;
    case 's':
      nextHeight = clampDimension(localDelta.y, minSize);
      break;
    case 'n':
      nextHeight = clampDimension(-localDelta.y, minSize);
      break;
    case 'se':
    case 'ne':
    case 'nw':
    case 'sw': {
      const rawWidth =
        handle === 'se' || handle === 'ne'
          ? clampDimension(localDelta.x, minSize)
          : clampDimension(-localDelta.x, minSize);
      const rawHeight =
        handle === 'se' || handle === 'sw'
          ? clampDimension(localDelta.y, minSize)
          : clampDimension(-localDelta.y, minSize);
      const scale = Math.max(rawWidth / element.width, rawHeight / element.height);
      nextWidth = clampDimension(element.width * scale, minSize);
      nextHeight = clampDimension(element.height * scale, minSize);
      break;
    }
  }

  const nextAnchorLocal = getOppositeAnchorPoint(nextWidth, nextHeight, handle);
  const anchorToCenter = rotateVector(
    {
      x: nextWidth / 2 - nextAnchorLocal.x,
      y: nextHeight / 2 - nextAnchorLocal.y,
    },
    rotation,
  );
  const nextCenter = {
    x: anchorWorld.x + anchorToCenter.x,
    y: anchorWorld.y + anchorToCenter.y,
  };

  return {
    x: nextCenter.x - nextWidth / 2,
    y: nextCenter.y - nextHeight / 2,
    width: nextWidth,
    height: nextHeight,
  };
}

export function rotateElementFromPointer(
  element: Pick<BaseCanvasElement, 'x' | 'y' | 'width' | 'height'>,
  pointer: CanvasPoint,
  snap = false,
  snapAngle = ROTATION_SNAP_DEGREES,
): number {
  const center = getElementCenter(element);
  const degrees = Math.atan2(pointer.y - center.y, pointer.x - center.x) * (180 / Math.PI) + 90;
  const normalized = normalizeRotation(degrees);

  if (!snap) {
    return normalized;
  }

  return normalizeRotation(Math.round(normalized / snapAngle) * snapAngle);
}
