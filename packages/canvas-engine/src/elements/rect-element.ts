import type { RectElement } from '@design-editor/common-types';

export function drawRectElement(
  context: CanvasRenderingContext2D,
  element: RectElement,
): void {
  const roundedContext = context as CanvasRenderingContext2D & {
    roundRect?: (
      x: number,
      y: number,
      width: number,
      height: number,
      radii?: number | number[],
    ) => void;
  };

  context.beginPath();

  if (typeof roundedContext.roundRect === 'function') {
    roundedContext.roundRect(
      element.x,
      element.y,
      element.width,
      element.height,
      element.cornerRadius,
    );
  } else {
    context.rect(element.x, element.y, element.width, element.height);
  }

  context.fillStyle = element.fill;
  context.fill();

  if (element.stroke) {
    context.strokeStyle = element.stroke.color;
    context.lineWidth = element.stroke.width;
    context.stroke();
  }
}
