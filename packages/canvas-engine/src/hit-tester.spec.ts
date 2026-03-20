import { describe, expect, it } from 'vitest';

import type { CanvasElement } from '@design-editor/common-types';

import { HitTester } from './hit-tester';

const elements: CanvasElement[] = [
  {
    id: 'group-1',
    name: 'Group 1',
    type: 'group',
    x: 0,
    y: 0,
    width: 160,
    height: 160,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    childIds: ['rect-1', 'rect-2'],
  },
  {
    id: 'rect-1',
    name: 'Rect 1',
    type: 'rect',
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    fill: '#ff0000',
    cornerRadius: 0,
  },
  {
    id: 'rect-2',
    name: 'Rect 2',
    type: 'rect',
    x: 40,
    y: 40,
    width: 100,
    height: 100,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    fill: '#00ff00',
    cornerRadius: 0,
  },
];

describe('HitTester', () => {
  it('returns the top-most visible element for a point', () => {
    const hitTester = new HitTester();
    const result = hitTester.hitTest(elements, { x: 60, y: 60 });

    expect(result?.element.id).toBe('rect-2');
  });

  it('returns null when a point misses all elements', () => {
    const hitTester = new HitTester();

    expect(hitTester.hitTest(elements, { x: 240, y: 240 })).toBeNull();
  });

  it('prefers a concrete child element over a covering group', () => {
    const hitTester = new HitTester();
    const result = hitTester.hitTest(elements, { x: 60, y: 60 });

    expect(result?.element.type).toBe('rect');
    expect(result?.element.id).toBe('rect-2');
  });

  it('falls back to the group when no child element matches', () => {
    const hitTester = new HitTester();
    const result = hitTester.hitTest(elements, { x: 150, y: 150 });

    expect(result?.element.type).toBe('group');
    expect(result?.element.id).toBe('group-1');
  });

  it('hit-tests rotated elements against their actual rotated footprint', () => {
    const hitTester = new HitTester();
    const rotatedElement: CanvasElement = {
      id: 'rect-rotated',
      name: 'Rotated Rect',
      type: 'rect',
      x: 120,
      y: 120,
      width: 200,
      height: 80,
      rotation: 45,
      opacity: 1,
      visible: true,
      locked: false,
      fill: '#2563eb',
      cornerRadius: 0,
    };

    expect(hitTester.hitTest([rotatedElement], { x: 220, y: 160 })?.element.id).toBe('rect-rotated');
    expect(hitTester.hitTest([rotatedElement], { x: 310, y: 110 })).toBeNull();
  });
});
