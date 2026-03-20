import type { CanvasBounds, CanvasElement, CanvasPoint } from '@design-editor/common-types';

import { getSelectionBounds, isPointInElement } from './transform';

export type HitTestResult = {
  element: CanvasElement;
  bounds: CanvasBounds;
};

export class HitTester {
  hitTest(elements: CanvasElement[], point: CanvasPoint): HitTestResult | null {
    let groupFallback: HitTestResult | null = null;

    for (let index = elements.length - 1; index >= 0; index -= 1) {
      const element = elements[index];

      if (!element.visible) {
        continue;
      }

      const bounds = this.getBounds(element);
      if (this.containsPoint(element, point)) {
        if (element.type === 'group') {
          groupFallback ??= { element, bounds };
          continue;
        }

        return { element, bounds };
      }
    }

    return groupFallback;
  }

  getBounds(element: CanvasElement): CanvasBounds {
    return getSelectionBounds(element);
  }

  private containsPoint(element: CanvasElement, point: CanvasPoint): boolean {
    return isPointInElement(element, point);
  }
}
