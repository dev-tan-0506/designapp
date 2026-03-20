import type { TextElement } from '@design-editor/common-types';

export function drawTextElement(
  context: CanvasRenderingContext2D,
  element: TextElement,
): void {
  context.fillStyle = element.fill;
  context.font = `${element.fontStyle} ${element.fontWeight} ${element.fontSize}px ${toCanvasFontFamily(
    element.fontFamily,
  )}`;
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
    const lineY = element.y + index * element.fontSize * element.lineHeight;
    context.fillText(line, x, lineY);

    if (!element.underline) {
      return;
    }

    const metrics = context.measureText(line);
    const lineStartX =
      element.textAlign === 'left'
        ? x
        : element.textAlign === 'center'
          ? x - metrics.width / 2
          : x - metrics.width;

    context.beginPath();
    context.strokeStyle = element.fill;
    context.lineWidth = Math.max(1, element.fontSize * 0.06);
    context.moveTo(lineStartX, lineY + element.fontSize + 2);
    context.lineTo(lineStartX + metrics.width, lineY + element.fontSize + 2);
    context.stroke();
  });
}

function toCanvasFontFamily(fontFamily: string): string {
  const normalizedFontFamily = fontFamily.includes(' ') ? `"${fontFamily}"` : fontFamily;

  return `${normalizedFontFamily}, sans-serif`;
}
