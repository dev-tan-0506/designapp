import { describe, expect, it } from 'vitest';

import type { BaseCanvasElement } from '@design-editor/common-types';

import {
  getElementCenter,
  getTransformHandleDescriptors,
  resizeElementFromHandle,
  rotateElementFromPointer,
} from './transform';

function createElement(overrides: Partial<BaseCanvasElement> = {}): BaseCanvasElement {
  return {
    id: 'element-1',
    name: 'Element 1',
    type: 'rect',
    x: 100,
    y: 80,
    width: 240,
    height: 120,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    ...overrides,
  };
}

describe('transform helpers', () => {
  it('returns handle geometry for all visible resize edges and rotation', () => {
    const handles = getTransformHandleDescriptors(createElement());

    expect(handles.map((handle) => handle.handle)).toEqual([
      'nw',
      'n',
      'ne',
      'e',
      'se',
      's',
      'sw',
      'w',
      'rotate',
    ]);
    expect(handles.find((handle) => handle.handle === 'rotate')?.point).toEqual({
      x: 220,
      y: 48,
    });
  });

  it('resizes corner handles proportionally from the opposite anchor', () => {
    const element = createElement();
    const resized = resizeElementFromHandle(element, 'se', {
      x: 460,
      y: 200,
    });

    expect(resized.width / resized.height).toBeCloseTo(element.width / element.height, 5);
    expect(resized.x).toBe(100);
    expect(resized.y).toBe(80);
    expect(resized.width).toBeGreaterThan(element.width);
  });

  it('resizes edge handles freely along the requested axis', () => {
    const element = createElement({
      rotation: 25,
    });
    const center = getElementCenter(element);
    const pointer = {
      x: center.x + 160,
      y: center.y,
    };
    const resized = resizeElementFromHandle(element, 'e', pointer);

    expect(resized.height).toBe(element.height);
    expect(resized.width).toBeGreaterThan(element.width);
  });

  it('snaps rotation to 15-degree increments when requested', () => {
    const element = createElement();
    const center = getElementCenter(element);

    expect(
      rotateElementFromPointer(element, {
        x: center.x + 80,
        y: center.y - 140,
      }),
    ).not.toBe(30);
    expect(
      rotateElementFromPointer(
        element,
        {
          x: center.x + 80,
          y: center.y - 140,
        },
        true,
      ),
    ).toBe(30);
  });
});
