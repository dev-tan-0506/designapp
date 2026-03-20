import type { TextElement } from '@design-editor/common-types';

export function drawTextElement(
  context: CanvasRenderingContext2D,
  element: TextElement,
): void {
  context.fillStyle = element.fill;
  context.font = `${element.fontStyle} ${element.fontWeight} ${element.fontSize}px ${element.fontFamily}`;
  context.textAlign = element.textAlign;
  context.textBaseline = 'top';

  const lines = element.text.split('\n');
  const x =
    element.textAlign === 'left'
      ? element.x
      : element.textAlign === 'center'
        ? element.x + element.width / 2
        : element.x + element.width;

  lines.forEach((line, index) => {
    context.fillText(line, x, element.y + index * element.fontSize * element.lineHeight);
  });
}
