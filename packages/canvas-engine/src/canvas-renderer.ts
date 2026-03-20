import type { CanvasElement, CanvasSize, DesignDocument } from '@design-editor/common-types';

import { dispatchCanvasRendered } from './events';
import { ElementFactory } from './element-factory';
import { HitTester, type HitTestResult } from './hit-tester';
import { ImageCache } from './image-cache';
import { drawImageElement } from './elements/image-element';
import {
  clampZoom,
  fitViewportToCanvas,
  sanitizeStageSize,
  screenToCanvasPoint,
  zoomViewportAtPoint,
  type ViewportState,
} from './viewport';

const DEFAULT_CANVAS_SIZE: CanvasSize = {
  width: 1200,
  height: 800,
};

export type CanvasRendererOptions = {
  eventTarget?: EventTarget;
  getDevicePixelRatio?: () => number;
  requestFrame?: (callback: FrameRequestCallback) => number;
  cancelFrame?: (handle: number) => void;
  imageCache?: ImageCache;
};

export type RenderStats = {
  renderCount: number;
  lastDurationMs: number;
  scheduledFrames: number;
};

export type { ViewportState };

export class CanvasRenderer {
  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;
  private readonly elementFactory = new ElementFactory();
  private readonly hitTester = new HitTester();
  private readonly eventTarget: EventTarget;
  private readonly getDevicePixelRatio: () => number;
  private readonly requestFrame: (callback: FrameRequestCallback) => number;
  private readonly cancelFrame: (handle: number) => void;
  private readonly imageCache: ImageCache;
  private readonly handleImageStateChange = () => {
    this.invalidate();
  };

  private document: DesignDocument | null = null;
  private pixelRatio = 1;
  private frameHandle: number | null = null;
  private dirty = false;
  private renderCount = 0;
  private lastDurationMs = 0;
  private scheduledFrames = 0;
  private previewElement: CanvasElement | null = null;
  private viewport: ViewportState = {
    zoom: 1,
    pan: { x: 0, y: 0 },
    stageSize: DEFAULT_CANVAS_SIZE,
  };

  constructor(canvas: HTMLCanvasElement, options: CanvasRendererOptions = {}) {
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('CanvasRenderer requires a 2D canvas context.');
    }

    this.canvas = canvas;
    this.context = context;
    this.eventTarget = options.eventTarget ?? canvas;
    this.getDevicePixelRatio = options.getDevicePixelRatio ?? (() => window.devicePixelRatio || 1);
    this.requestFrame = options.requestFrame ?? window.requestAnimationFrame.bind(window);
    this.cancelFrame = options.cancelFrame ?? window.cancelAnimationFrame.bind(window);
    this.imageCache = options.imageCache ?? new ImageCache();

    this.applyCanvasScale(this.viewport.stageSize);
  }

  setDocument(document: DesignDocument): void {
    this.document = document;
    this.invalidate();
  }

  setPreviewElement(element: CanvasElement | null): void {
    this.previewElement = element;
    this.invalidate();
  }

  resize(size: CanvasSize): void {
    this.viewport = {
      ...this.viewport,
      stageSize: sanitizeStageSize(size),
    };
    this.applyCanvasScale(this.viewport.stageSize);
    this.invalidate();
  }

  setViewport(viewport: ViewportState): ViewportState {
    this.viewport = {
      zoom: clampZoom(viewport.zoom),
      pan: { ...viewport.pan },
      stageSize: sanitizeStageSize(viewport.stageSize),
    };
    this.applyCanvasScale(this.viewport.stageSize);
    this.invalidate();

    return this.getViewport();
  }

  getViewport(): ViewportState {
    return {
      zoom: this.viewport.zoom,
      pan: { ...this.viewport.pan },
      stageSize: { ...this.viewport.stageSize },
    };
  }

  setZoom(zoom: number, screenPoint?: { x: number; y: number }): ViewportState {
    this.viewport = screenPoint
      ? zoomViewportAtPoint(this.viewport, zoom, screenPoint)
      : {
          ...this.viewport,
          zoom: clampZoom(zoom),
        };
    this.invalidate();

    return this.getViewport();
  }

  zoomBy(multiplier: number, screenPoint?: { x: number; y: number }): ViewportState {
    return this.setZoom(this.viewport.zoom * multiplier, screenPoint);
  }

  panBy(delta: { x: number; y: number }): ViewportState {
    this.viewport = {
      ...this.viewport,
      pan: {
        x: this.viewport.pan.x + delta.x,
        y: this.viewport.pan.y + delta.y,
      },
    };
    this.invalidate();

    return this.getViewport();
  }

  fitToViewport(padding = 0): ViewportState | null {
    if (!this.document) {
      return null;
    }

    this.viewport = fitViewportToCanvas(this.document.canvas, this.viewport.stageSize, padding);
    this.invalidate();

    return this.getViewport();
  }

  screenToCanvas(screenPoint: { x: number; y: number }): { x: number; y: number } {
    return screenToCanvasPoint(this.viewport, screenPoint);
  }

  invalidate(): void {
    this.dirty = true;

    if (this.frameHandle !== null) {
      return;
    }

    this.scheduledFrames += 1;
    this.frameHandle = this.requestFrame(() => {
      this.frameHandle = null;

      if (this.dirty) {
        this.renderNow();
      }
    });
  }

  renderNow(): RenderStats {
    if (this.frameHandle !== null) {
      this.cancelFrame(this.frameHandle);
      this.frameHandle = null;
    }

    this.syncDevicePixelRatio();
    this.dirty = false;

    const startedAt = performance.now();

    this.context.save();
    this.context.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
    this.context.clearRect(0, 0, this.viewport.stageSize.width, this.viewport.stageSize.height);

    if (this.document) {
      this.context.save();
      this.context.setTransform(
        this.pixelRatio * this.viewport.zoom,
        0,
        0,
        this.pixelRatio * this.viewport.zoom,
        this.pixelRatio * this.viewport.pan.x,
        this.pixelRatio * this.viewport.pan.y,
      );
      this.context.fillStyle = this.document.canvas.backgroundColor;
      this.context.fillRect(0, 0, this.document.canvas.width, this.document.canvas.height);

      for (const element of this.document.elements) {
        this.drawElement(element);
      }

      if (this.previewElement) {
        this.drawElement(this.previewElement);
      }
      this.context.restore();
    }

    this.context.restore();

    this.renderCount += 1;
    this.lastDurationMs = performance.now() - startedAt;

    dispatchCanvasRendered(this.eventTarget, {
      documentId: this.document?.id ?? null,
      elementCount: this.document?.elements.length ?? 0,
      durationMs: this.lastDurationMs,
      renderCount: this.renderCount,
    });

    return this.getRenderStats();
  }

  hitTest(x: number, y: number): HitTestResult | null {
    if (!this.document) {
      return null;
    }

    return this.hitTester.hitTest(this.document.elements, this.screenToCanvas({ x, y }));
  }

  getRenderStats(): RenderStats {
    return {
      renderCount: this.renderCount,
      lastDurationMs: this.lastDurationMs,
      scheduledFrames: this.scheduledFrames,
    };
  }

  destroy(): void {
    if (this.frameHandle !== null) {
      this.cancelFrame(this.frameHandle);
      this.frameHandle = null;
    }
  }

  private drawElement(element: CanvasElement): void {
    if (!element.visible || element.opacity <= 0) {
      return;
    }

    this.context.save();
    this.context.globalAlpha = element.opacity;

    if (element.rotation !== 0) {
      const centerX = element.x + element.width / 2;
      const centerY = element.y + element.height / 2;
      this.context.translate(centerX, centerY);
      this.context.rotate((element.rotation * Math.PI) / 180);
      this.context.translate(-centerX, -centerY);
    }

    if (element.type === 'image') {
      drawImageElement(
        this.context,
        element,
        this.imageCache.read(element.src, this.handleImageStateChange),
      );
      this.context.restore();
      return;
    }

    this.elementFactory.draw(this.context, element);
    this.context.restore();
  }

  private syncDevicePixelRatio(): void {
    const nextPixelRatio = Math.max(1, this.getDevicePixelRatio());

    if (nextPixelRatio !== this.pixelRatio) {
      this.applyCanvasScale(this.viewport.stageSize);
    }
  }

  private applyCanvasScale(size: CanvasSize): void {
    this.pixelRatio = Math.max(1, this.getDevicePixelRatio());
    this.canvas.width = Math.floor(size.width * this.pixelRatio);
    this.canvas.height = Math.floor(size.height * this.pixelRatio);
    this.canvas.style.width = `${size.width}px`;
    this.canvas.style.height = `${size.height}px`;
    this.context.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
    this.context.imageSmoothingEnabled = true;
    this.context.imageSmoothingQuality = 'high';
  }
}
