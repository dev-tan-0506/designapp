import { describe, expect, it, vi } from 'vitest';

import type { TextElement } from '@design-editor/common-types';

import { drawTextElement } from './text-element';

describe('drawTextElement', () => {
  it('renders underlined text using a canvas-safe font family string', () => {
    const context = {
      fillStyle: '',
      font: '',
      textAlign: 'left',
      textBaseline: 'top',
      fillText: vi.fn(),
      measureText: vi.fn().mockReturnValue({ width: 120 }),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      strokeStyle: '',
      lineWidth: 1,
    } as unknown as CanvasRenderingContext2D;
    const element: TextElement = {
      id: 'text-1',
      name: 'Text 1',
      type: 'text',
      x: 20,
      y: 30,
      width: 240,
      height: 80,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      text: 'Hello',
      fontFamily: 'Open Sans',
      fontSize: 32,
      fontWeight: 700,
      fontStyle: 'italic',
      underline: true,
      textAlign: 'left',
      fill: '#111827',
      lineHeight: 1.2,
    };

    drawTextElement(context, element);

    expect(context.font).toContain('"Open Sans", sans-serif');
    expect(context.fillText).toHaveBeenCalledWith('Hello', 20, 30);
    expect(context.beginPath).toHaveBeenCalledTimes(1);
    expect(context.moveTo).toHaveBeenCalledWith(20, 64);
    expect(context.lineTo).toHaveBeenCalledWith(140, 64);
    expect(context.stroke).toHaveBeenCalledTimes(1);
  });
});
