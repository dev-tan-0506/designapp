import { describe, expect, it, vi } from 'vitest';

import type { CanvasElement, DesignDocument } from '@design-editor/common-types';

import { createBenchmarkDocument, runRendererBenchmark } from './benchmark';
import { CanvasRenderer } from './canvas-renderer';

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
});
