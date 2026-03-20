import type { CanvasElement } from '@design-editor/common-types';

import { drawEllipseElement } from './elements/ellipse-element';
import { drawGroupElement } from './elements/group-element';
import { drawImageElement } from './elements/image-element';
import { drawRectElement } from './elements/rect-element';
import { drawTextElement } from './elements/text-element';

export type ElementDrawStrategy<TElement extends CanvasElement = CanvasElement> = (
  context: CanvasRenderingContext2D,
  element: TElement,
) => void;

export class ElementFactory {
  create<TElement extends CanvasElement>(element: TElement): ElementDrawStrategy<TElement> {
    switch (element.type) {
      case 'ellipse':
        return drawEllipseElement as ElementDrawStrategy<TElement>;
      case 'group':
        return drawGroupElement as ElementDrawStrategy<TElement>;
      case 'image':
        return drawImageElement as ElementDrawStrategy<TElement>;
      case 'rect':
        return drawRectElement as ElementDrawStrategy<TElement>;
      case 'text':
        return drawTextElement as ElementDrawStrategy<TElement>;
      default:
        throw new Error(`Unsupported element type: ${(element as CanvasElement).type}`);
    }
  }

  draw(context: CanvasRenderingContext2D, element: CanvasElement): void {
    this.create(element)(context, element);
  }
}
