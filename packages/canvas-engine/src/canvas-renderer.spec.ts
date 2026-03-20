import { describe, expect, it, vi } from 'vitest';

import type { CanvasElement, DesignDocument } from '@design-editor/common-types';

import { createBenchmarkDocument, runRendererBenchmark } from './benchmark';
import { CanvasRenderer } from './canvas-renderer';
import { ImageCache } from './image-cache';
import { createShapeBounds } from './shape-creation';

function createRectElement(index: number): CanvasElement {
  return {
    id: `rect-${index}`,
    name: `Rect ${index}`,
    type: 'rect',
    x: (index % 20) * 45,
    y: Math.floor(index / 20) * 45,
    width: 40,
    height: 40,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    fill: index % 2 === 0 ? '#0f766e' : '#0ea5e9',
    cornerRadius: 6,
  };
}

function createDocument(elementCount: number): DesignDocument {
  return {
    id: `doc-${elementCount}`,
    name: 'Benchmark document',
    canvas: {
      width: 1200,
      height: 800,
      backgroundColor: '#ffffff',
    },
    elements: Array.from({ length: elementCount }, (_, index) => createRectElement(index)),
    selectedElementIds: [],
    updatedAt: '2026-03-20T00:00:00.000Z',
  };
}

describe('CanvasRenderer', () => {
  it('scales the backing store for HiDPI displays', () => {
    const canvas = document.createElement('canvas');
    const renderer = new CanvasRenderer(canvas, {
      getDevicePixelRatio: () => 2,
    });

    renderer.setDocument(createDocument(1));

    expect(canvas.width).toBe(2400);
    expect(canvas.height).toBe(1600);
    expect(canvas.style.width).toBe('1200px');
    expect(canvas.style.height).toBe('800px');
  });

  it('clamps zoom and keeps the focal point stable', () => {
    const canvas = document.createElement('canvas');
    const renderer = new CanvasRenderer(canvas);
    renderer.resize({ width: 800, height: 600 });
    renderer.setDocument(createDocument(1));

    const screenPoint = { x: 300, y: 220 };
    const beforeZoom = renderer.screenToCanvas(screenPoint);

    renderer.setZoom(999, screenPoint);

    expect(renderer.getViewport().zoom).toBe(8);
    expect(renderer.screenToCanvas(screenPoint).x).toBeCloseTo(beforeZoom.x, 5);
    expect(renderer.screenToCanvas(screenPoint).y).toBeCloseTo(beforeZoom.y, 5);
  });

  it('fits the document inside the stage viewport', () => {
    const canvas = document.createElement('canvas');
    const renderer = new CanvasRenderer(canvas);
    renderer.resize({ width: 600, height: 400 });
    renderer.setDocument(createDocument(1));

    const viewport = renderer.fitToViewport();

    expect(viewport).not.toBeNull();
    expect(viewport?.zoom).toBeCloseTo(0.5, 5);
    expect(viewport?.pan.x).toBeCloseTo(0, 5);
    expect(viewport?.pan.y).toBeCloseTo(0, 5);
  });

  it('fits very large canvases even when the fit zoom is below 10%', () => {
    const canvas = document.createElement('canvas');
    const renderer = new CanvasRenderer(canvas);
    renderer.resize({ width: 600, height: 400 });
    renderer.setDocument({
      ...createDocument(0),
      canvas: {
        width: 20_000,
        height: 20_000,
        backgroundColor: '#ffffff',
      },
    });

    const viewport = renderer.fitToViewport();

    expect(viewport).not.toBeNull();
    expect(viewport?.zoom).toBeCloseTo(0.02, 5);
    expect(viewport?.pan.x).toBeCloseTo(100, 5);
    expect(viewport?.pan.y).toBeCloseTo(0, 5);
  });

  it('converts screen coordinates using the active viewport state', () => {
    const canvas = document.createElement('canvas');
    const renderer = new CanvasRenderer(canvas);
    renderer.setViewport({
      zoom: 2,
      pan: { x: 100, y: 60 },
      stageSize: { width: 800, height: 600 },
    });

    expect(renderer.screenToCanvas({ x: 160, y: 100 })).toEqual({ x: 30, y: 20 });
  });

  it('batches invalidations into a single scheduled frame', () => {
    const callbacks: FrameRequestCallback[] = [];
    const canvas = document.createElement('canvas');
    const renderer = new CanvasRenderer(canvas, {
      requestFrame: (callback) => {
        callbacks.push(callback);
        return callbacks.length;
      },
      cancelFrame: vi.fn(),
    });

    renderer.setDocument(createDocument(60));
    renderer.invalidate();
    renderer.invalidate();
    renderer.invalidate();

    expect(callbacks).toHaveLength(1);

    callbacks[0](16);

    expect(renderer.getRenderStats().renderCount).toBe(1);
    expect(renderer.getRenderStats().scheduledFrames).toBe(1);
  });

  it('provides an executable benchmark harness for a 200-element document', () => {
    const canvas = document.createElement('canvas');
    const renderer = new CanvasRenderer(canvas);
    const benchmarkDocument = createBenchmarkDocument(200);
    const result = runRendererBenchmark(renderer, benchmarkDocument, 5);

    expect(result.samples).toHaveLength(5);
    expect(result.averageMs).toBeGreaterThanOrEqual(0);
    expect(result.maxMs).toBeGreaterThanOrEqual(result.minMs);
  });

  it('hit-tests using screen coordinates after zoom and pan', () => {
    const canvas = document.createElement('canvas');
    const renderer = new CanvasRenderer(canvas);
    renderer.setDocument(createDocument(1));
    renderer.setViewport({
      zoom: 2,
      pan: { x: 80, y: 40 },
      stageSize: { width: 1200, height: 800 },
    });

    const hit = renderer.hitTest(100, 60);

    expect(hit?.element.id).toBe('rect-0');
  });

  it('supports drawing preview elements without mutating the committed document count', () => {
    const eventTarget = new EventTarget();
    const renderedEvents: Array<{ elementCount: number }> = [];
    const canvas = document.createElement('canvas');
    const renderer = new CanvasRenderer(canvas, { eventTarget });
    eventTarget.addEventListener('canvas:rendered', (event) => {
      renderedEvents.push((event as CustomEvent<{ elementCount: number }>).detail);
    });
    renderer.setDocument(createDocument(0));

    renderer.setPreviewElement(
      createRectElement(99),
    );
    renderer.renderNow();

    expect(renderedEvents.at(-1)?.elementCount).toBe(0);
  });

  it('derives shape bounds from viewport-aware canvas coordinates', () => {
    const canvas = document.createElement('canvas');
    const renderer = new CanvasRenderer(canvas);
    renderer.setViewport({
      zoom: 2,
      pan: { x: 80, y: 40 },
      stageSize: { width: 1200, height: 800 },
    });

    const start = renderer.screenToCanvas({ x: 200, y: 140 });
    const end = renderer.screenToCanvas({ x: 320, y: 260 });

    expect(createShapeBounds(start, end)).toEqual({
      x: 60,
      y: 50,
      width: 60,
      height: 60,
    });
  });

  it('draws committed image elements with drawImage and high-quality smoothing when the bitmap is loaded', () => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Missing 2D context in test.');
    }

    const drawImageSpy = vi.spyOn(context, 'drawImage');
    const imageCache = new ImageCache();
    const loadedImage = document.createElement('img');
    imageCache.primeLoaded('https://signed.example/image.png', loadedImage);

    const renderer = new CanvasRenderer(canvas, {
      imageCache,
    });

    renderer.setDocument({
      id: 'doc-image',
      name: 'Image document',
      canvas: {
        width: 1200,
        height: 800,
        backgroundColor: '#ffffff',
      },
      elements: [
        {
          id: 'image-1',
          name: 'Image 1',
          type: 'image',
          x: 40,
          y: 60,
          width: 320,
          height: 200,
          rotation: 0,
          opacity: 1,
          visible: true,
          locked: false,
          src: 'https://signed.example/image.png',
          alt: 'Uploaded asset',
          intrinsicWidth: 3200,
          intrinsicHeight: 2000,
        },
      ],
      selectedElementIds: [],
      updatedAt: '2026-03-20T00:00:00.000Z',
    });

    renderer.renderNow();

    expect(context.imageSmoothingEnabled).toBe(true);
    expect(context.imageSmoothingQuality).toBe('high');
    expect(drawImageSpy).toHaveBeenCalledTimes(1);
    expect(drawImageSpy).toHaveBeenCalledWith(loadedImage, 40, 60, 320, 200);
  });
});
