import type { GroupElement } from '@design-editor/common-types';

export function drawGroupElement(
  context: CanvasRenderingContext2D,
  element: GroupElement,
): void {
  context.strokeStyle = '#7c6ee6';
  context.lineWidth = 1.5;
  context.setLineDash([6, 4]);
  context.strokeRect(element.x, element.y, element.width, element.height);
  context.setLineDash([]);
}
