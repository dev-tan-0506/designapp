import type { ImageElement } from '@design-editor/common-types';

import type { CachedImageState } from '../image-cache';

function drawPlaceholder(
  context: CanvasRenderingContext2D,
  element: ImageElement,
  label: string,
): void {
  context.fillStyle = '#d7dde3';
  context.fillRect(element.x, element.y, element.width, element.height);

  context.strokeStyle = '#77808a';
  context.lineWidth = 2;
  context.strokeRect(element.x, element.y, element.width, element.height);

  context.beginPath();
  context.moveTo(element.x, element.y);
  context.lineTo(element.x + element.width, element.y + element.height);
  context.moveTo(element.x + element.width, element.y);
  context.lineTo(element.x, element.y + element.height);
  context.stroke();

  context.fillStyle = '#31414d';
  context.font = '600 14px sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(
    label,
    element.x + element.width / 2,
    element.y + element.height / 2,
  );
}

export function drawImageElement(
  context: CanvasRenderingContext2D,
  element: ImageElement,
  imageState?: CachedImageState,
): void {
  if (imageState?.status === 'loaded' && imageState.image) {
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(
      imageState.image,
      element.x,
      element.y,
      element.width,
      element.height,
    );
    return;
  }

  drawPlaceholder(
    context,
    element,
    imageState?.status === 'error' ? (element.alt || 'Image unavailable') : (element.alt || 'Loading image'),
  );
}
