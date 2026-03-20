import type { CanvasBounds, CanvasElement, CanvasPoint } from '@design-editor/common-types';

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
      if (this.containsPoint(bounds, point)) {
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
    return {
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
    };
  }

  private containsPoint(bounds: CanvasBounds, point: CanvasPoint): boolean {
    return (
      point.x >= bounds.x &&
      point.x <= bounds.x + bounds.width &&
      point.y >= bounds.y &&
      point.y <= bounds.y + bounds.height
    );
  }
}
