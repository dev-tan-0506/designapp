import type {
  CanvasBounds,
  CanvasPoint,
  EllipseElement,
  RectElement,
} from '@design-editor/common-types';

export type ShapeTool = 'rectangle' | 'ellipse';

export type ShapeElementOptions = {
  id: string;
  name: string;
  bounds: CanvasBounds;
  fill: string;
  strokeColor: string;
  strokeWidth: number;
  cornerRadius?: number;
};

export function createShapeBounds(
  origin: CanvasPoint,
  current: CanvasPoint,
  options: {
    preserveAspectRatio?: boolean;
  } = {},
): CanvasBounds {
  const rawWidth = current.x - origin.x;
  const rawHeight = current.y - origin.y;

  if (options.preserveAspectRatio) {
    const size = Math.max(Math.abs(rawWidth), Math.abs(rawHeight));
    const signedWidth = size * getConstrainedDragDirection(rawWidth, rawHeight);
    const signedHeight = size * getConstrainedDragDirection(rawHeight, rawWidth);

    return normalizeBounds(origin, signedWidth, signedHeight);
  }

  return normalizeBounds(origin, rawWidth, rawHeight);
}

export function createShapeElement(
  tool: ShapeTool,
  options: ShapeElementOptions,
): RectElement | EllipseElement {
  const baseElement = {
    id: options.id,
    name: options.name,
    x: options.bounds.x,
    y: options.bounds.y,
    width: options.bounds.width,
    height: options.bounds.height,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    fill: options.fill,
    stroke: {
      color: options.strokeColor,
      width: options.strokeWidth,
    },
  };

  if (tool === 'rectangle') {
    return {
      ...baseElement,
      type: 'rect',
      cornerRadius: options.cornerRadius ?? 12,
    };
  }

  return {
    ...baseElement,
    type: 'ellipse',
  };
}

function normalizeBounds(origin: CanvasPoint, width: number, height: number): CanvasBounds {
  return {
    x: width >= 0 ? origin.x : origin.x + width,
    y: height >= 0 ? origin.y : origin.y + height,
    width: Math.abs(width),
    height: Math.abs(height),
  };
}

function getConstrainedDragDirection(primaryAxisDelta: number, fallbackAxisDelta: number): number {
  if (primaryAxisDelta !== 0) {
    return primaryAxisDelta < 0 ? -1 : 1;
  }

  return fallbackAxisDelta < 0 ? -1 : 1;
}
