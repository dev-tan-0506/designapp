import { describe, expect, it } from 'vitest';

import { createShapeBounds, createShapeElement } from './shape-creation';

describe('shape-creation', () => {
  it('normalizes drag bounds when dragging leftward and upward', () => {
    expect(
      createShapeBounds(
        { x: 240, y: 180 },
        { x: 120, y: 90 },
      ),
    ).toEqual({
      x: 120,
      y: 90,
      width: 120,
      height: 90,
    });
  });

  it('constrains ellipse bounds to a circle when preserveAspectRatio is enabled', () => {
    expect(
      createShapeBounds(
        { x: 100, y: 100 },
        { x: 160, y: 130 },
        { preserveAspectRatio: true },
      ),
    ).toEqual({
      x: 100,
      y: 100,
      width: 60,
      height: 60,
    });
  });

  it('preserves the drag quadrant when shift-drawing straight upward', () => {
    expect(
      createShapeBounds(
        { x: 200, y: 200 },
        { x: 200, y: 140 },
        { preserveAspectRatio: true },
      ),
    ).toEqual({
      x: 140,
      y: 140,
      width: 60,
      height: 60,
    });
  });

  it('creates rectangle and ellipse elements with shared fill and stroke defaults', () => {
    const rectangle = createShapeElement('rectangle', {
      id: 'rect-1',
      name: 'Rectangle 1',
      bounds: { x: 10, y: 20, width: 150, height: 90 },
      fill: '#22c55e',
      strokeColor: '#0f172a',
      strokeWidth: 3,
      cornerRadius: 14,
    });
    const ellipse = createShapeElement('ellipse', {
      id: 'ellipse-1',
      name: 'Ellipse 1',
      bounds: { x: 40, y: 50, width: 80, height: 80 },
      fill: '#f97316',
      strokeColor: '#111827',
      strokeWidth: 2,
    });

    expect(rectangle).toMatchObject({
      type: 'rect',
      fill: '#22c55e',
      stroke: { color: '#0f172a', width: 3 },
      cornerRadius: 14,
    });
    expect(ellipse).toMatchObject({
      type: 'ellipse',
      fill: '#f97316',
      stroke: { color: '#111827', width: 2 },
    });
  });
});
