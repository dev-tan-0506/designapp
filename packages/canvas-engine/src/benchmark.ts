import type { CanvasElement, DesignDocument } from '@design-editor/common-types';

import type { CanvasRenderer } from './canvas-renderer';

export type RendererBenchmarkResult = {
  samples: number[];
  averageMs: number;
  minMs: number;
  maxMs: number;
};

function createRectElement(index: number): CanvasElement {
  return {
    id: `benchmark-rect-${index}`,
    name: `Benchmark Rect ${index}`,
    type: 'rect',
    x: (index % 20) * 54,
    y: Math.floor(index / 20) * 54,
    width: 44,
    height: 44,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    fill: index % 2 === 0 ? '#0f766e' : '#0ea5e9',
    cornerRadius: 8,
  };
}

export function createBenchmarkDocument(elementCount = 200): DesignDocument {
  return {
    id: `benchmark-${elementCount}`,
    name: 'Renderer benchmark',
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

export function runRendererBenchmark(
  renderer: CanvasRenderer,
  document: DesignDocument,
  iterations = 20,
): RendererBenchmarkResult {
  renderer.setDocument(document);

  const samples = Array.from({ length: iterations }, () => renderer.renderNow().lastDurationMs);
  const averageMs = samples.reduce((total, duration) => total + duration, 0) / samples.length;

  return {
    samples,
    averageMs,
    minMs: Math.min(...samples),
    maxMs: Math.max(...samples),
  };
}
