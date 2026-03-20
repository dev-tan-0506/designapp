import type { EllipseElement } from '@design-editor/common-types';

export function drawEllipseElement(
  context: CanvasRenderingContext2D,
  element: EllipseElement,
): void {
  context.beginPath();
  context.ellipse(
    element.x + element.width / 2,
    element.y + element.height / 2,
    element.width / 2,
    element.height / 2,
    0,
    0,
    Math.PI * 2,
  );
  context.fillStyle = element.fill;
  context.fill();

  if (element.stroke) {
    context.strokeStyle = element.stroke.color;
    context.lineWidth = element.stroke.width;
    context.stroke();
  }
}
