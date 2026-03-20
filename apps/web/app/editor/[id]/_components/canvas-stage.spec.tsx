/** @vitest-environment jsdom */

import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { refreshImageAssetReadUrl, uploadImageAsset } from '../../../../lib/image-upload';
import { useDocumentStore } from '../../../../stores/use-document-store';
import { useUIStore } from '../../../../stores/use-ui-store';
import { CanvasStage } from './canvas-stage';

let documentChangedListener:
  | ((detail: {
      document: unknown;
    }) => void)
  | null = null;

vi.mock('@design-editor/canvas-engine', () => {
  class MockCanvasRenderer {
    constructor(private readonly canvas: HTMLCanvasElement) {}

    setDocument = vi.fn();

    setPreviewElement = vi.fn();

    resize = vi.fn();

    destroy = vi.fn();

    getViewport = vi.fn(() => ({
      zoom: 1,
      pan: { x: 0, y: 0 },
      stageSize: { width: 1200, height: 800 },
    }));

    fitToViewport = vi.fn(() => ({
      zoom: 1,
      pan: { x: 0, y: 0 },
      stageSize: { width: 1200, height: 800 },
    }));

    screenToCanvas = vi.fn((point: { x: number; y: number }) => ({
      x: point.x + 100,
      y: point.y + 50,
    }));

    zoomBy = vi.fn();

    panBy = vi.fn();

    hitTest = vi.fn(() => null);

    renderNow = vi.fn(() => ({
      renderCount: 1,
      lastDurationMs: 0,
      scheduledFrames: 1,
    }));
  }

  return {
    CanvasRenderer: MockCanvasRenderer,
    createBenchmarkDocument: vi.fn(() => ({
      id: 'benchmark',
      name: 'benchmark',
      canvas: { width: 1200, height: 800, backgroundColor: '#ffffff' },
      elements: [],
      selectedElementIds: [],
      updatedAt: '2026-03-20T00:00:00.000Z',
    })),
    createShapeBounds: vi.fn(() => ({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    })),
    createShapeElement: vi.fn(),
    dispatchDocumentChanged: vi.fn((_target: EventTarget, document: unknown) => {
      documentChangedListener?.({ document });
    }),
    onCanvasRendered: vi.fn(() => () => undefined),
    onDocumentChanged: vi.fn((_target: EventTarget, callback: typeof documentChangedListener) => {
      documentChangedListener = callback;
      return () => {
        documentChangedListener = null;
      };
    }),
    runRendererBenchmark: vi.fn(() => ({
      samples: [0],
      averageMs: 0,
      minMs: 0,
      maxMs: 0,
    })),
  };
});

vi.mock('../../../../lib/image-upload', () => ({
  UnsupportedImageUploadError: class UnsupportedImageUploadError extends Error {},
  refreshImageAssetReadUrl: vi.fn(),
  uploadImageAsset: vi.fn(),
}));

class MockResizeObserver {
  constructor(
    private readonly callback: ResizeObserverCallback,
  ) {}

  observe(target: Element): void {
    this.callback(
      [
        {
          target,
          contentRect: {
            width: 1200,
            height: 800,
          } as DOMRectReadOnly,
        } as ResizeObserverEntry,
      ],
      this as unknown as ResizeObserver,
    );
  }

  disconnect(): void {}

  unobserve(): void {}
}

describe('CanvasStage', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.clearAllMocks();
    useDocumentStore.setState({ document: null });
    useUIStore.setState({
      zoomPercent: 100,
      pan: { x: 0, y: 0 },
      stageSize: { width: 1200, height: 800 },
      activeTool: 'select',
      textEditingElementId: null,
      typographyMode: 'simple',
      fontSearchQuery: '',
      fontSearchStatus: 'idle',
      imageUploadStatus: 'idle',
      imageUploadError: null,
      isNewDesignDialogOpen: false,
      newDesignWidth: 1200,
      newDesignHeight: 800,
    });
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    vi.stubGlobal('ResizeObserver', MockResizeObserver);
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    vi.unstubAllGlobals();
  });

  it('uses viewport-aware drop coordinates for image placement and exits text edit mode', async () => {
    vi.mocked(uploadImageAsset).mockResolvedValue({
      assetId: 'asset-1',
      src: 'http://localhost:3001/api/v1/storage/image-assets/asset-1/file?token=read-token',
      alt: 'hero-banner',
      intrinsicWidth: 1600,
      intrinsicHeight: 900,
      readUrlExpiresAt: '2026-03-20T17:00:00.000Z',
    });

    await act(async () => {
      root.render(<CanvasStage documentId="story-1-6" />);
    });

    await act(async () => {
      useDocumentStore.getState().selectElement('text-title');
      useUIStore.getState().setTextEditingElementId('text-title');
    });

    const canvas = container.querySelector('canvas');
    if (!canvas) {
      throw new Error('Canvas element not found.');
    }

    Object.defineProperty(canvas, 'getBoundingClientRect', {
      value: () => ({
        left: 10,
        top: 20,
        width: 1200,
        height: 800,
        right: 1210,
        bottom: 820,
        x: 10,
        y: 20,
        toJSON: () => null,
      }),
    });

    const dropTarget = canvas.parentElement;
    if (!dropTarget) {
      throw new Error('Stage viewport element not found.');
    }

    const dropEvent = new Event('drop', {
      bubbles: true,
      cancelable: true,
    }) as Event & {
      clientX: number;
      clientY: number;
      dataTransfer: {
        files: File[];
      };
    };
    dropEvent.clientX = 110;
    dropEvent.clientY = 80;
    dropEvent.dataTransfer = {
      files: [new File(['png-bytes'], 'hero-banner.png', { type: 'image/png' })],
    };

    await act(async () => {
      dropTarget.dispatchEvent(dropEvent);
      await Promise.resolve();
    });

    const documentState = useDocumentStore.getState().document;
    const placedImage = documentState?.elements.find((element) => element.id === documentState.selectedElementIds[0]);

    expect(uploadImageAsset).toHaveBeenCalledTimes(1);
    expect(useUIStore.getState().textEditingElementId).toBeNull();
    expect(useUIStore.getState().activeTool).toBe('select');
    expect(placedImage).toMatchObject({
      type: 'image',
      x: 200,
      y: 110,
      assetId: 'asset-1',
      width: 1600,
      height: 900,
      intrinsicWidth: 1600,
      intrinsicHeight: 900,
      readUrlExpiresAt: '2026-03-20T17:00:00.000Z',
    });
  });

  it('refreshes expiring signed image URLs in the background using the committed asset id', async () => {
    vi.mocked(refreshImageAssetReadUrl).mockResolvedValue({
      readUrl: 'http://localhost:3001/api/v1/storage/image-assets/asset-1/file?token=fresh-token',
      readUrlExpiresAt: '2099-03-20T18:00:00.000Z',
    });

    await act(async () => {
      root.render(<CanvasStage documentId="story-1-6" />);
    });

    await act(async () => {
      useDocumentStore.getState().commitImageElement({
        id: 'image-1',
        name: 'Uploaded image',
        type: 'image',
        x: 180,
        y: 120,
        width: 1920,
        height: 1080,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        src: 'http://localhost:3001/api/v1/storage/image-assets/asset-1/file?token=stale-token',
        alt: 'uploaded-image',
        assetId: 'asset-1',
        intrinsicWidth: 1920,
        intrinsicHeight: 1080,
        readUrlExpiresAt: '2000-01-01T00:00:00.000Z',
      });
      await Promise.resolve();
    });

    await act(async () => {
      await Promise.resolve();
    });

    const refreshedImage = useDocumentStore
      .getState()
      .document?.elements.find((element) => element.id === 'image-1');

    expect(refreshImageAssetReadUrl).toHaveBeenCalledWith('asset-1');
    expect(refreshedImage).toMatchObject({
      type: 'image',
      src: 'http://localhost:3001/api/v1/storage/image-assets/asset-1/file?token=fresh-token',
      readUrlExpiresAt: '2099-03-20T18:00:00.000Z',
    });
  });
});
