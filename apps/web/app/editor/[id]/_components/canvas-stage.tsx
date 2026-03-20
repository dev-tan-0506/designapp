'use client';

import React, {
  useEffect,
  useRef,
  useState,
  type ChangeEvent as ReactChangeEvent,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from 'react';
import type {
  CanvasElement,
  EllipseElement,
  ImageElement,
  RectElement,
  TextElement,
} from '@design-editor/common-types';
import {
  CanvasRenderer,
  createBenchmarkDocument,
  createShapeBounds,
  createShapeElement,
  dispatchDocumentChanged,
  getTransformHandleDescriptors,
  onCanvasRendered,
  onDocumentChanged,
  resizeElementFromHandle,
  rotateElementFromPointer,
  runRendererBenchmark,
  screenFromCanvas,
  type CanvasRenderedDetail,
  type ShapeTool,
  type TransformHandle,
} from '@design-editor/canvas-engine';

import {
  GoogleFontsConfigurationError,
  loadGoogleFontFamily,
} from '../../../../lib/google-fonts';
import {
  refreshImageAssetReadUrl,
  UnsupportedImageUploadError,
  uploadImageAsset,
} from '../../../../lib/image-upload';
import { useDocumentStore } from '../../../../stores/use-document-store';
import { useUIStore, type ActiveTool } from '../../../../stores/use-ui-store';
import { FontPicker } from './font-picker';
import { NewDesignDialog } from './new-design-dialog';
import { TextEditorOverlay } from './text-editor-overlay';

type CanvasStageProps = {
  documentId: string;
};

type PanSession = {
  pointerId: number;
  lastClientPoint: {
    x: number;
    y: number;
  };
};

type DrawSession = {
  pointerId: number;
  tool: ShapeTool;
  originCanvasPoint: {
    x: number;
    y: number;
  };
};

type TransformableElement = RectElement | EllipseElement | TextElement | ImageElement;

type MoveSession = {
  kind: 'move';
  pointerId: number;
  elementId: string;
  lastCanvasPoint: {
    x: number;
    y: number;
  };
};

type ResizeSession = {
  kind: 'resize';
  pointerId: number;
  elementId: string;
  handle: Exclude<TransformHandle, 'rotate'>;
  initialElement: TransformableElement;
};

type RotateSession = {
  kind: 'rotate';
  pointerId: number;
  elementId: string;
  initialElement: TransformableElement;
};

type TransformSession = MoveSession | ResizeSession | RotateSession;

const INITIAL_RENDER_DETAIL: CanvasRenderedDetail = {
  documentId: null,
  elementCount: 0,
  durationMs: 0,
  renderCount: 0,
};

const FIT_PADDING = 48;
const DEFAULT_SHAPE_FILL = '#f59e0b';
const DEFAULT_SHAPE_STROKE_COLOR = '#1f2937';
const DEFAULT_SHAPE_STROKE_WIDTH = 2;
const DEFAULT_RECTANGLE_RADIUS = 14;
const DEFAULT_TEXT_FILL = '#111827';
const DEFAULT_TEXT_FONT_FAMILY = 'Inter';
const DEFAULT_TEXT_FONT_SIZE = 48;
const DEFAULT_TEXT_WIDTH = 260;
const DEFAULT_TEXT_HEIGHT = 80;
const READ_URL_REFRESH_BUFFER_MS = 5 * 60 * 1000;
const GOOGLE_FONTS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_FONTS_API_KEY;
const SUPPORTED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT' ||
    target.isContentEditable
  );
}

function normalizeWheelDelta(event: ReactWheelEvent<HTMLCanvasElement>): number {
  if (event.deltaMode === 1) {
    return event.deltaY * 16;
  }

  if (event.deltaMode === 2) {
    return event.deltaY * 100;
  }

  return event.deltaY;
}

function isShapeTool(tool: ActiveTool): tool is ShapeTool {
  return tool === 'rectangle' || tool === 'ellipse';
}

function isShapeElement(element: CanvasElement | null | undefined): element is RectElement | EllipseElement {
  return element?.type === 'rect' || element?.type === 'ellipse';
}

function isTextElement(element: CanvasElement | null | undefined): element is TextElement {
  return element?.type === 'text';
}

function isImageElement(element: CanvasElement | null | undefined): element is ImageElement {
  return element?.type === 'image';
}

function isTransformableElement(element: CanvasElement | null | undefined): element is TransformableElement {
  return isShapeElement(element) || isTextElement(element) || isImageElement(element);
}

function getShapeName(tool: ShapeTool, elements: CanvasElement[]): string {
  const shapeCount = elements.filter((element) =>
    tool === 'rectangle' ? element.type === 'rect' : element.type === 'ellipse',
  ).length;

  return `${tool === 'rectangle' ? 'Rectangle' : 'Ellipse'} ${shapeCount + 1}`;
}

function getTextName(elements: CanvasElement[]): string {
  const textCount = elements.filter((element) => element.type === 'text').length;

  return `Text ${textCount + 1}`;
}

function getImageName(elements: CanvasElement[]): string {
  const imageCount = elements.filter((element) => element.type === 'image').length;

  return `Image ${imageCount + 1}`;
}

function createShapeFromDrag(
  tool: ShapeTool,
  origin: { x: number; y: number },
  current: { x: number; y: number },
  preserveAspectRatio: boolean,
  id: string,
  name: string,
  opacity = 1,
): RectElement | EllipseElement | null {
  const bounds = createShapeBounds(origin, current, {
    preserveAspectRatio,
  });

  if (bounds.width === 0 || bounds.height === 0) {
    return null;
  }

  return {
    ...createShapeElement(tool, {
      id,
      name,
      bounds,
      fill: DEFAULT_SHAPE_FILL,
      strokeColor: DEFAULT_SHAPE_STROKE_COLOR,
      strokeWidth: DEFAULT_SHAPE_STROKE_WIDTH,
      cornerRadius: DEFAULT_RECTANGLE_RADIUS,
    }),
    opacity,
  };
}

function createTextElementFromPoint(
  point: { x: number; y: number },
  id: string,
  name: string,
): TextElement {
  return {
    id,
    name,
    type: 'text',
    x: point.x,
    y: point.y,
    width: DEFAULT_TEXT_WIDTH,
    height: DEFAULT_TEXT_HEIGHT,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    text: 'Type here',
    fontFamily: DEFAULT_TEXT_FONT_FAMILY,
    fontSize: DEFAULT_TEXT_FONT_SIZE,
    fontWeight: 400,
    fontStyle: 'normal',
    underline: false,
    textAlign: 'left',
    fill: DEFAULT_TEXT_FILL,
    lineHeight: 1.2,
  };
}

function createImageElementFromPoint(
  point: { x: number; y: number },
  uploadedAsset: Awaited<ReturnType<typeof uploadImageAsset>>,
  id: string,
  name: string,
): ImageElement {
  return {
    id,
    name,
    type: 'image',
    x: point.x,
    y: point.y,
    width: uploadedAsset.intrinsicWidth,
    height: uploadedAsset.intrinsicHeight,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    src: uploadedAsset.src,
    alt: uploadedAsset.alt,
    assetId: uploadedAsset.assetId,
    intrinsicWidth: uploadedAsset.intrinsicWidth,
    intrinsicHeight: uploadedAsset.intrinsicHeight,
    readUrlExpiresAt: uploadedAsset.readUrlExpiresAt,
  };
}

function getSupportedImageFile(fileList: FileList | null): File | null {
  if (!fileList) {
    return null;
  }

  return Array.from(fileList).find((file) => SUPPORTED_IMAGE_MIME_TYPES.has(file.type)) ?? null;
}

function toColorInputValue(value: string | undefined, fallback: string): string {
  if (value && /^#[0-9a-fA-F]{6}$/.test(value)) {
    return value;
  }

  return fallback;
}

function clampStrokeWidth(value: number): number {
  return Math.min(32, Math.max(1, Math.floor(value)));
}

function clampFontSize(value: number): number {
  return Math.min(240, Math.max(8, Math.floor(value)));
}

function isImageReadUrlExpiring(readUrlExpiresAt: string | undefined): boolean {
  if (!readUrlExpiresAt) {
    return false;
  }

  const expiresAt = Date.parse(readUrlExpiresAt);
  if (Number.isNaN(expiresAt)) {
    return true;
  }

  return expiresAt <= Date.now() + READ_URL_REFRESH_BUFFER_MS;
}

function getSelectionFrame(element: TransformableElement, zoom: number, panOffset: { x: number; y: number }) {
  const topLeft = screenFromCanvas(
    {
      x: element.x,
      y: element.y,
    },
    zoom,
    panOffset,
  );

  return {
    left: topLeft.x,
    top: topLeft.y,
    width: element.width * zoom,
    height: element.height * zoom,
    rotation: element.rotation,
  };
}

export function CanvasStage({ documentId }: CanvasStageProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageViewportRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const eventTargetRef = useRef<EventTarget>(new EventTarget());
  const initialDispatchRef = useRef(false);
  const benchmarkCompletedRef = useRef(false);
  const hasMeasuredStageRef = useRef(false);
  const pendingFitRef = useRef(true);
  const refreshingImageElementIdsRef = useRef(new Set<string>());
  const panSessionRef = useRef<PanSession | null>(null);
  const drawSessionRef = useRef<DrawSession | null>(null);
  const transformSessionRef = useRef<TransformSession | null>(null);
  const spacePressedRef = useRef(false);
  const document = useDocumentStore((state) => state.document);
  const seedDocument = useDocumentStore((state) => state.seedDocument);
  const createDocument = useDocumentStore((state) => state.createDocument);
  const selectElement = useDocumentStore((state) => state.selectElement);
  const commitShapeElement = useDocumentStore((state) => state.commitShapeElement);
  const commitTextElement = useDocumentStore((state) => state.commitTextElement);
  const commitImageElement = useDocumentStore((state) => state.commitImageElement);
  const updateImageElementSource = useDocumentStore((state) => state.updateImageElementSource);
  const updateTextElementContent = useDocumentStore((state) => state.updateTextElementContent);
  const updateTextElementStyle = useDocumentStore((state) => state.updateTextElementStyle);
  const updateSelectedShapeStyle = useDocumentStore((state) => state.updateSelectedShapeStyle);
  const updateSelectedTextStyle = useDocumentStore((state) => state.updateSelectedTextStyle);
  const moveElement = useDocumentStore((state) => state.moveElement);
  const resizeElement = useDocumentStore((state) => state.resizeElement);
  const rotateElement = useDocumentStore((state) => state.rotateElement);
  const reorderElement = useDocumentStore((state) => state.reorderElement);
  const zoomPercent = useUIStore((state) => state.zoomPercent);
  const pan = useUIStore((state) => state.pan);
  const stageSize = useUIStore((state) => state.stageSize);
  const activeTool = useUIStore((state) => state.activeTool);
  const textEditingElementId = useUIStore((state) => state.textEditingElementId);
  const typographyMode = useUIStore((state) => state.typographyMode);
  const fontSearchQuery = useUIStore((state) => state.fontSearchQuery);
  const fontSearchStatus = useUIStore((state) => state.fontSearchStatus);
  const imageUploadStatus = useUIStore((state) => state.imageUploadStatus);
  const imageUploadError = useUIStore((state) => state.imageUploadError);
  const isNewDesignDialogOpen = useUIStore((state) => state.isNewDesignDialogOpen);
  const newDesignWidth = useUIStore((state) => state.newDesignWidth);
  const newDesignHeight = useUIStore((state) => state.newDesignHeight);
  const openNewDesignDialog = useUIStore((state) => state.openNewDesignDialog);
  const closeNewDesignDialog = useUIStore((state) => state.closeNewDesignDialog);
  const setNewDesignDimensions = useUIStore((state) => state.setNewDesignDimensions);
  const setStageSize = useUIStore((state) => state.setStageSize);
  const setViewport = useUIStore((state) => state.setViewport);
  const setActiveTool = useUIStore((state) => state.setActiveTool);
  const setTextEditingElementId = useUIStore((state) => state.setTextEditingElementId);
  const setTypographyMode = useUIStore((state) => state.setTypographyMode);
  const setFontSearchQuery = useUIStore((state) => state.setFontSearchQuery);
  const setFontSearchStatus = useUIStore((state) => state.setFontSearchStatus);
  const setImageUploadState = useUIStore((state) => state.setImageUploadState);
  const [renderDetail, setRenderDetail] = useState(INITIAL_RENDER_DETAIL);
  const [benchmarkAverage, setBenchmarkAverage] = useState<number | null>(null);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isTransforming, setIsTransforming] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const selectedElementId = document?.selectedElementIds[0] ?? null;
  const selectedElement = document?.elements.find((element) => element.id === selectedElementId) ?? null;
  const selectedShape = isShapeElement(selectedElement) ? selectedElement : null;
  const selectedText = isTextElement(selectedElement) ? selectedElement : null;
  const selectedImage = isImageElement(selectedElement) ? selectedElement : null;
  const selectedTransformableElement = isTransformableElement(selectedElement) ? selectedElement : null;
  const editingTextCandidate = document?.elements.find((element) => element.id === textEditingElementId) ?? null;
  const editingText = isTextElement(editingTextCandidate) ? editingTextCandidate : null;
  const activeTextElementId = editingText?.id ?? selectedText?.id ?? null;
  const selectionFrame =
    selectedTransformableElement && activeTool === 'select' && textEditingElementId !== selectedTransformableElement.id
      ? getSelectionFrame(selectedTransformableElement, zoomPercent / 100, pan)
      : null;
  const selectionHandles =
    selectedTransformableElement && selectionFrame
      ? getTransformHandleDescriptors(selectedTransformableElement).map((handle) => ({
          ...handle,
          screenPoint: screenFromCanvas(handle.point, zoomPercent / 100, pan),
        }))
      : [];
  const northHandle = selectionHandles.find((handle) => handle.handle === 'n');
  const rotateHandle = selectionHandles.find((handle) => handle.handle === 'rotate');

  const syncViewportFromRenderer = () => {
    const renderer = rendererRef.current;

    if (!renderer) {
      return;
    }

    const viewport = renderer.getViewport();
    setViewport(Math.round(viewport.zoom * 100), viewport.pan);
  };

  const fitRendererToViewport = () => {
    const renderer = rendererRef.current;

    if (!renderer || !document) {
      return;
    }

    renderer.fitToViewport(FIT_PADDING);
    syncViewportFromRenderer();
    pendingFitRef.current = false;
  };

  const clearPreviewShape = () => {
    rendererRef.current?.setPreviewElement(null);
  };

  const getViewportCenterCanvasPoint = () => {
    const renderer = rendererRef.current;

    if (renderer) {
      return renderer.screenToCanvas({
        x: stageSize.width / 2,
        y: stageSize.height / 2,
      });
    }

    if (document) {
      return {
        x: document.canvas.width / 2,
        y: document.canvas.height / 2,
      };
    }

    return null;
  };

  const getCanvasPoint = (clientX: number, clientY: number) => {
    const renderer = rendererRef.current;
    const canvas = canvasRef.current;

    if (!renderer || !canvas) {
      return null;
    }

    const rect = canvas.getBoundingClientRect();
    return renderer.screenToCanvas({
      x: clientX - rect.left,
      y: clientY - rect.top,
    });
  };

  const getCanvasScreenPoint = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return null;
    }

    const rect = canvas.getBoundingClientRect();

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const stopDrawing = (pointerId?: number) => {
    if (pointerId !== undefined && drawSessionRef.current?.pointerId !== pointerId) {
      return;
    }

    const activePointerId = drawSessionRef.current?.pointerId;
    drawSessionRef.current = null;
    clearPreviewShape();
    setIsDrawing(false);

    if (activePointerId !== undefined && canvasRef.current?.hasPointerCapture(activePointerId)) {
      canvasRef.current.releasePointerCapture(activePointerId);
    }
  };

  const stopTextEditing = () => {
    setTextEditingElementId(null);
  };

  const stopTransformSession = (pointerId?: number) => {
    if (pointerId !== undefined && transformSessionRef.current?.pointerId !== pointerId) {
      return;
    }

    const activePointerId = transformSessionRef.current?.pointerId;
    transformSessionRef.current = null;
    setIsTransforming(false);

    if (activePointerId !== undefined && canvasRef.current?.hasPointerCapture(activePointerId)) {
      canvasRef.current.releasePointerCapture(activePointerId);
    }
  };

  const startTransformSession = (session: TransformSession) => {
    transformSessionRef.current = session;
    canvasRef.current?.setPointerCapture(session.pointerId);
    setIsTransforming(true);
  };

  const updateActiveTextStyle = (style: Parameters<typeof updateTextElementStyle>[1]) => {
    if (activeTextElementId) {
      updateTextElementStyle(activeTextElementId, style);
      return;
    }

    updateSelectedTextStyle(style);
  };

  const commitDrawnShape = (
    session: DrawSession,
    currentPoint: { x: number; y: number },
    preserveAspectRatio: boolean,
  ) => {
    const nextShape = createShapeFromDrag(
      session.tool,
      session.originCanvasPoint,
      currentPoint,
      preserveAspectRatio,
      crypto.randomUUID(),
      getShapeName(session.tool, document?.elements ?? []),
    );

    if (!nextShape) {
      return;
    }

    commitShapeElement(nextShape);
  };

  const handleApplyFontFamily = async (fontFamily: string) => {
    const targetElementId = activeTextElementId;
    if (!targetElementId) {
      return;
    }

    setFontSearchStatus('loading');

    try {
      await loadGoogleFontFamily(fontFamily);
      updateTextElementStyle(targetElementId, {
        fontFamily,
      });
      setFontSearchQuery(fontFamily);
      setFontSearchStatus('success');
    } catch (error) {
      if (error instanceof GoogleFontsConfigurationError) {
        setFontSearchQuery(fontFamily);
      }
      setFontSearchStatus('error');
    }
  };

  const placeUploadedImage = async (file: File, placementPoint?: { x: number; y: number } | null) => {
    const targetPoint = placementPoint ?? getViewportCenterCanvasPoint();
    if (!targetPoint) {
      setImageUploadState('error', 'Canvas is not ready to place uploaded images yet.');
      return;
    }

    stopTextEditing();
    clearPreviewShape();
    setImageUploadState('loading');

    try {
      const uploadedAsset = await uploadImageAsset(file);
      const imageElement = createImageElementFromPoint(
        targetPoint,
        uploadedAsset,
        crypto.randomUUID(),
        getImageName(document?.elements ?? []),
      );

      commitImageElement(imageElement);
      setImageUploadState('success');
      setActiveTool('select');
    } catch (error) {
      setImageUploadState(
        'error',
        error instanceof UnsupportedImageUploadError || error instanceof Error
          ? error.message
          : 'Image upload failed.',
      );
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleResizePointerDown =
    (handle: Exclude<TransformHandle, 'rotate'>) => (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (!selectedTransformableElement || activeTool !== 'select') {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      startTransformSession({
        kind: 'resize',
        pointerId: event.pointerId,
        elementId: selectedTransformableElement.id,
        handle,
        initialElement: selectedTransformableElement,
      });
    };

  const handleRotatePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!selectedTransformableElement || activeTool !== 'select') {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    startTransformSession({
      kind: 'rotate',
      pointerId: event.pointerId,
      elementId: selectedTransformableElement.id,
      initialElement: selectedTransformableElement,
    });
  };

  useEffect(() => {
    seedDocument(documentId);
  }, [documentId, seedDocument]);

  useEffect(() => {
    if (!canvasRef.current) {
      return undefined;
    }

    const eventTarget = eventTargetRef.current;
    const renderer = new CanvasRenderer(canvasRef.current, {
      eventTarget,
    });
    rendererRef.current = renderer;

    const unsubscribeDocument = onDocumentChanged(eventTarget, ({ document: nextDocument }) => {
      renderer.setDocument(nextDocument);
    });
    const unsubscribeRendered = onCanvasRendered(eventTarget, (detail) => {
      setRenderDetail(detail);
    });

    return () => {
      unsubscribeDocument();
      unsubscribeRendered();
      renderer.destroy();
      rendererRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!stageViewportRef.current || !rendererRef.current) {
      return undefined;
    }

    const stageElement = stageViewportRef.current;
    const renderer = rendererRef.current;
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];

      if (!entry) {
        return;
      }

      const nextSize = {
        width: Math.max(1, Math.floor(entry.contentRect.width)),
        height: Math.max(1, Math.floor(entry.contentRect.height)),
      };

      hasMeasuredStageRef.current = true;
      renderer.resize(nextSize);
      setStageSize(nextSize);

      if (pendingFitRef.current && document) {
        fitRendererToViewport();
      } else {
        syncViewportFromRenderer();
      }
    });

    resizeObserver.observe(stageElement);

    return () => {
      resizeObserver.disconnect();
    };
  }, [document, setStageSize]);

  useEffect(() => {
    if (!document) {
      return;
    }

    if (!benchmarkCompletedRef.current && rendererRef.current) {
      const benchmarkResult = runRendererBenchmark(
        rendererRef.current,
        createBenchmarkDocument(200),
      );
      setBenchmarkAverage(benchmarkResult.averageMs);
      benchmarkCompletedRef.current = true;
    }

    dispatchDocumentChanged(
      eventTargetRef.current,
      document,
      initialDispatchRef.current ? 'store' : 'initial-load',
    );

    if (hasMeasuredStageRef.current && pendingFitRef.current) {
      fitRendererToViewport();
    }

    initialDispatchRef.current = true;
  }, [document]);

  useEffect(() => {
    if (!selectedText) {
      return;
    }

    setFontSearchQuery(selectedText.fontFamily);
  }, [selectedText, setFontSearchQuery]);

  useEffect(() => {
    if (!document) {
      return;
    }

    for (const element of document.elements) {
      if (!isImageElement(element) || !element.assetId || !isImageReadUrlExpiring(element.readUrlExpiresAt)) {
        continue;
      }

      if (refreshingImageElementIdsRef.current.has(element.id)) {
        continue;
      }

      refreshingImageElementIdsRef.current.add(element.id);

      void refreshImageAssetReadUrl(element.assetId)
        .then((refreshedAsset) => {
          updateImageElementSource(element.id, {
            src: refreshedAsset.readUrl,
            readUrlExpiresAt: refreshedAsset.readUrlExpiresAt,
          });
        })
        .catch(() => undefined)
        .finally(() => {
          refreshingImageElementIdsRef.current.delete(element.id);
        });
    }
  }, [document, updateImageElementSource]);

  useEffect(() => {
    if (!selectedElementId && textEditingElementId) {
      setTextEditingElementId(null);
      return;
    }

    if (textEditingElementId && selectedElementId && selectedElementId !== textEditingElementId) {
      setTextEditingElementId(null);
    }
  }, [selectedElementId, setTextEditingElementId, textEditingElementId]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Escape' && transformSessionRef.current) {
        event.preventDefault();
        stopTransformSession(transformSessionRef.current.pointerId);
        return;
      }

      if (event.code === 'Escape' && drawSessionRef.current) {
        event.preventDefault();
        stopDrawing(drawSessionRef.current.pointerId);
        return;
      }

      if (event.code === 'Escape' && textEditingElementId) {
        event.preventDefault();
        stopTextEditing();
        return;
      }

      if (isEditableTarget(event.target)) {
        return;
      }

      if (textEditingElementId) {
        return;
      }

      const renderer = rendererRef.current;
      if (!renderer) {
        return;
      }

      if (event.code === 'Space') {
        event.preventDefault();
        if (!spacePressedRef.current) {
          spacePressedRef.current = true;
          setIsSpacePressed(true);
        }
        return;
      }

      if (!event.ctrlKey && !event.metaKey) {
        return;
      }

      const focusPoint = {
        x: stageSize.width / 2,
        y: stageSize.height / 2,
      };

      if (event.key === '=' || event.key === '+') {
        event.preventDefault();
        renderer.zoomBy(1.15, focusPoint);
        syncViewportFromRenderer();
        return;
      }

      if (event.key === '-') {
        event.preventDefault();
        renderer.zoomBy(1 / 1.15, focusPoint);
        syncViewportFromRenderer();
        return;
      }

      if (event.key === '0') {
        event.preventDefault();
        fitRendererToViewport();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code !== 'Space') {
        return;
      }

      spacePressedRef.current = false;
      setIsSpacePressed(false);

      if (panSessionRef.current && canvasRef.current?.hasPointerCapture(panSessionRef.current.pointerId)) {
        canvasRef.current.releasePointerCapture(panSessionRef.current.pointerId);
      }

      panSessionRef.current = null;
      setIsPanning(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [stageSize.height, stageSize.width, textEditingElementId]);

  const handleWheel = (event: ReactWheelEvent<HTMLCanvasElement>) => {
    if (textEditingElementId) {
      return;
    }

    const renderer = rendererRef.current;
    const canvas = canvasRef.current;

    if (!renderer || !canvas) {
      return;
    }

    event.preventDefault();

    const rect = canvas.getBoundingClientRect();
    const focusPoint = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    const delta = normalizeWheelDelta(event);
    const factor = Math.exp(-delta * (event.ctrlKey ? 0.002 : 0.001));

    renderer.zoomBy(factor, focusPoint);
    syncViewportFromRenderer();
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (textEditingElementId && activeTool !== 'text') {
      stopTextEditing();
      return;
    }

    if (textEditingElementId && activeTool === 'text') {
      stopTextEditing();
    }

    if (spacePressedRef.current) {
      event.preventDefault();

      panSessionRef.current = {
        pointerId: event.pointerId,
        lastClientPoint: {
          x: event.clientX,
          y: event.clientY,
        },
      };
      event.currentTarget.setPointerCapture(event.pointerId);
      setIsPanning(true);
      return;
    }

    const originCanvasPoint = getCanvasPoint(event.clientX, event.clientY);
    if (!originCanvasPoint) {
      return;
    }

    if (activeTool === 'select') {
      const screenPoint = getCanvasScreenPoint(event.clientX, event.clientY);
      const hit = screenPoint ? rendererRef.current?.hitTest(screenPoint.x, screenPoint.y) : null;

      if (!hit || !isTransformableElement(hit.element) || hit.element.locked) {
        selectElement(null);
        return;
      }

      event.preventDefault();
      selectElement(hit.element.id);
      event.currentTarget.setPointerCapture(event.pointerId);
      startTransformSession({
        kind: 'move',
        pointerId: event.pointerId,
        elementId: hit.element.id,
        lastCanvasPoint: originCanvasPoint,
      });
      return;
    }

    if (activeTool === 'text') {
      event.preventDefault();
      const textElement = createTextElementFromPoint(
        originCanvasPoint,
        crypto.randomUUID(),
        getTextName(document?.elements ?? []),
      );

      commitTextElement(textElement);
      setTextEditingElementId(textElement.id);
      setTypographyMode('simple');
      setFontSearchQuery(textElement.fontFamily);
      return;
    }

    if (!isShapeTool(activeTool)) {
      return;
    }

    event.preventDefault();
    drawSessionRef.current = {
      pointerId: event.pointerId,
      tool: activeTool,
      originCanvasPoint,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDrawing(true);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const renderer = rendererRef.current;
    const panSession = panSessionRef.current;
    const drawSession = drawSessionRef.current;
    const transformSession = transformSessionRef.current;

    if (renderer && panSession && panSession.pointerId === event.pointerId) {
      const delta = {
        x: event.clientX - panSession.lastClientPoint.x,
        y: event.clientY - panSession.lastClientPoint.y,
      };

      panSession.lastClientPoint = {
        x: event.clientX,
        y: event.clientY,
      };

      renderer.panBy(delta);
      syncViewportFromRenderer();
      return;
    }

    if (renderer && drawSession && drawSession.pointerId === event.pointerId) {
      const currentPoint = getCanvasPoint(event.clientX, event.clientY);
      if (!currentPoint) {
        return;
      }

      event.preventDefault();
      renderer.setPreviewElement(
        createShapeFromDrag(
          drawSession.tool,
          drawSession.originCanvasPoint,
          currentPoint,
          event.shiftKey && drawSession.tool === 'ellipse',
          'draft-shape',
          'Draft shape',
          0.65,
        ),
      );
      return;
    }

    if (!renderer || !transformSession || transformSession.pointerId !== event.pointerId) {
      return;
    }

    const currentPoint = getCanvasPoint(event.clientX, event.clientY);
    if (!currentPoint) {
      return;
    }

    event.preventDefault();

    if (transformSession.kind === 'move') {
      const delta = {
        x: currentPoint.x - transformSession.lastCanvasPoint.x,
        y: currentPoint.y - transformSession.lastCanvasPoint.y,
      };

      transformSession.lastCanvasPoint = currentPoint;
      moveElement(transformSession.elementId, delta);
      return;
    }

    if (transformSession.kind === 'resize') {
      resizeElement(
        transformSession.elementId,
        resizeElementFromHandle(
          transformSession.initialElement,
          transformSession.handle,
          currentPoint,
        ),
      );
      return;
    }

    rotateElement(
      transformSession.elementId,
      rotateElementFromPointer(transformSession.initialElement, currentPoint, event.shiftKey),
    );
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const drawSession = drawSessionRef.current;
    if (drawSession && drawSession.pointerId === event.pointerId) {
      const currentPoint = getCanvasPoint(event.clientX, event.clientY);
      if (currentPoint) {
        commitDrawnShape(
          drawSession,
          currentPoint,
          event.shiftKey && drawSession.tool === 'ellipse',
        );
      }

      stopDrawing(event.pointerId);
      return;
    }

    if (transformSessionRef.current?.pointerId === event.pointerId) {
      stopTransformSession(event.pointerId);
      return;
    }

    if (panSessionRef.current?.pointerId === event.pointerId) {
      panSessionRef.current = null;
      setIsPanning(false);
    }
  };

  const handlePointerCancel = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (drawSessionRef.current?.pointerId === event.pointerId) {
      stopDrawing(event.pointerId);
      return;
    }

    if (transformSessionRef.current?.pointerId === event.pointerId) {
      stopTransformSession(event.pointerId);
      return;
    }

    if (panSessionRef.current?.pointerId === event.pointerId) {
      panSessionRef.current = null;
      setIsPanning(false);
    }
  };

  const handleCreateNewDesign = () => {
    createDocument(documentId, newDesignWidth, newDesignHeight);
    closeNewDesignDialog();
    clearPreviewShape();
    stopTextEditing();
    setActiveTool('select');
    pendingFitRef.current = true;
  };

  const propertiesMode: 'text' | 'shape' | 'image' | 'none' = selectedText
    ? 'text'
    : selectedShape
      ? 'shape'
      : selectedImage
        ? 'image'
      : 'none';

  const handleImageToolClick = () => {
    stopTextEditing();
    setActiveTool('image');
    setImageUploadState('idle');
    fileInputRef.current?.click();
  };

  const handleFileInputChange = async (event: ReactChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) {
      event.target.value = '';
      setActiveTool('select');
      return;
    }

    const file = getSupportedImageFile(event.target.files);

    if (!file) {
      setImageUploadState('error', 'Only JPG, PNG, and WebP image uploads are supported.');
      event.target.value = '';
      return;
    }

    await placeUploadedImage(file);
  };

  const handleStageDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    const imageFile = getSupportedImageFile(event.dataTransfer.files);
    if (!imageFile) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  };

  const handleStageDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsDragOver(false);
    }
  };

  const handleStageDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    const imageFile = getSupportedImageFile(event.dataTransfer.files);
    setIsDragOver(false);

    if (!imageFile) {
      return;
    }

    event.preventDefault();
    await placeUploadedImage(imageFile, getCanvasPoint(event.clientX, event.clientY));
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-surface text-on-surface">
      <header className="bg-white/80 backdrop-blur-xl w-full sticky top-0 z-50 shadow-sm flex items-center justify-between px-6 py-3 border-b border-surface-container">
        <div className="flex items-center gap-8">
          <span className="text-xl font-black tracking-tighter text-primary">LucidEditor</span>
          <nav className="hidden md:flex items-center gap-6 font-sans antialiased text-sm font-medium">
            <a className="text-primary font-bold border-b-2 border-primary pb-1" href="#">Templates</a>
            <a className="text-on-surface-variant hover:text-on-surface transition-colors duration-200" href="#">Features</a>
            <a className="text-on-surface-variant hover:text-on-surface transition-colors duration-200" href="#">Learn</a>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-surface-container-low rounded-lg transition-colors">
              <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
            </button>
            <button className="p-2 hover:bg-surface-container-low rounded-lg transition-colors">
              <span className="material-symbols-outlined text-on-surface-variant">settings</span>
            </button>
          </div>
          <button className="bg-gradient-to-r from-primary to-primary-container text-on-primary px-6 py-2 rounded-full text-sm font-bold tracking-tight active:scale-95 transition-transform" onClick={() => openNewDesignDialog(document?.canvas)}>
            Create a design
          </button>
          <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-container-highest">
            <img alt="User profile" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCHagMYU3-RkBdDBSBorjj0J-m5A9iqB2iWfKBxXsCOyLEDm1c111q4oTDV30DlvDQLHOu7GRxnYhRtFjlzNYkkfqbE29gUdxqZ4taK7NIqmce5lDHpbx7cBZ8rgnVNWbTYKE9SE8BroHvUfpD7awriBcvvEobKuhQPyv74L_Mq_NU-NqNSrCiq2wxMK5w_0PZRI16SQ8AsEiOch_IRjX6rlnhG-MN2gPw7NjIZas77cwSGXjBPGIKYLAYd0YQlMpg24naeYQUVBeo" />
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-64px)] overflow-hidden">
        <aside className="h-full w-20 flex flex-col items-center z-40 bg-white border-r border-surface-container">
          <div className="flex flex-col gap-1 w-full py-4">
            <button onClick={() => { setActiveTool('select'); stopTextEditing(); }} className={activeTool === 'select' ? "text-primary border-l-4 border-primary bg-primary/5 flex flex-col items-center py-4 gap-1 group w-full" : "text-on-surface-variant flex flex-col items-center py-4 gap-1 hover:text-primary transition-all w-full"}>
              <span className="material-symbols-outlined scale-110" style={{ fontVariationSettings: "'FILL' 1" }}>pan_tool</span>
              <span className="text-[10px] uppercase font-bold tracking-widest">Select</span>
            </button>
            <button onClick={() => setActiveTool('text')} className={activeTool === 'text' ? "text-primary border-l-4 border-primary bg-primary/5 flex flex-col items-center py-4 gap-1 group w-full" : "text-on-surface-variant flex flex-col items-center py-4 gap-1 hover:text-primary transition-all w-full"}>
              <span className="material-symbols-outlined">title</span>
              <span className="text-[10px] uppercase font-bold tracking-widest">Text</span>
            </button>
            <button onClick={handleImageToolClick} className={activeTool === 'image' ? "text-primary border-l-4 border-primary bg-primary/5 flex flex-col items-center py-4 gap-1 group w-full" : "text-on-surface-variant flex flex-col items-center py-4 gap-1 hover:text-primary transition-all w-full"}>
              <span className="material-symbols-outlined">image</span>
              <span className="text-[10px] uppercase font-bold tracking-widest">Image</span>
            </button>
            <button onClick={() => setActiveTool('rectangle')} className={activeTool === 'rectangle' ? "text-primary border-l-4 border-primary bg-primary/5 flex flex-col items-center py-4 gap-1 group w-full" : "text-on-surface-variant flex flex-col items-center py-4 gap-1 hover:text-primary transition-all w-full"}>
              <span className="material-symbols-outlined">rectangle</span>
              <span className="text-[10px] uppercase font-bold tracking-widest">Rect</span>
            </button>
            <button onClick={() => setActiveTool('ellipse')} className={activeTool === 'ellipse' ? "text-primary border-l-4 border-primary bg-primary/5 flex flex-col items-center py-4 gap-1 group w-full" : "text-on-surface-variant flex flex-col items-center py-4 gap-1 hover:text-primary transition-all w-full"}>
              <span className="material-symbols-outlined">circle</span>
              <span className="text-[10px] uppercase font-bold tracking-widest">Ellipse</span>
            </button>
          </div>
        </aside>

        <aside className="h-full w-80 bg-surface-container-lowest border-r border-surface-container flex flex-col overflow-y-auto custom-scrollbar">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold tracking-tight text-on-surface">Properties</h2>
            </div>
            <div className="space-y-6">
              
              {propertiesMode === 'text' ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <p className="text-xs opacity-70 m-0">Text properties</p>
                      <h3 className="m-0 mt-1 text-sm font-bold">{selectedText?.name ?? 'No text selected'}</h3>
                    </div>
                    {textEditingElementId === selectedText?.id ? (
                      <button onClick={stopTextEditing} className="px-3 py-1 bg-surface-container-highest rounded-full text-xs font-bold text-on-surface transition-colors hover:bg-outline-variant/30">Done</button>
                    ) : (
                      <button onClick={() => { if (selectedText) setTextEditingElementId(selectedText.id); }} className="px-3 py-1 bg-surface-container-high rounded-full text-xs font-bold text-on-surface transition-colors hover:bg-outline-variant/30">Edit</button>
                    )}
                  </div>
                  <div className="flex gap-2">
                     <button onClick={() => setTypographyMode('simple')} className={`px-3 py-1.5 rounded-full text-xs font-semibold ${typographyMode === 'simple' ? 'bg-primary/10 text-primary border border-primary/30' : 'bg-surface-container border border-outline-variant/30 text-on-surface'}`}>Simple</button>
                     <button onClick={() => setTypographyMode('pro')} className={`px-3 py-1.5 rounded-full text-xs font-semibold ${typographyMode === 'pro' ? 'bg-primary/10 text-primary border border-primary/30' : 'bg-surface-container border border-outline-variant/30 text-on-surface'}`}>Pro</button>
                  </div>
                  
                  <div className="bg-surface-container-lowest rounded-xl border border-surface-container p-2">
                    <FontPicker
                        apiKey={GOOGLE_FONTS_API_KEY}
                        query={fontSearchQuery}
                        status={fontSearchStatus}
                        selectedFamily={selectedText?.fontFamily ?? DEFAULT_TEXT_FONT_FAMILY}
                        isCatalogConfigured={Boolean(GOOGLE_FONTS_API_KEY)}
                        onQueryChange={setFontSearchQuery}
                        onStatusChange={setFontSearchStatus}
                        onSelectFamily={handleApplyFontFamily}
                    />
                  </div>
                  
                  <div className="grid gap-1">
                    <label className="text-xs opacity-70">Font size</label>
                    <input type="number" min={8} max={240} className="w-full bg-surface-container-low rounded-lg border border-outline-variant/20 px-3 py-2 text-sm text-on-surface"
                       value={selectedText?.fontSize ?? DEFAULT_TEXT_FONT_SIZE}
                       onChange={(event) => updateActiveTextStyle({ fontSize: clampFontSize(Number.parseInt(event.target.value, 10) || DEFAULT_TEXT_FONT_SIZE) })} />
                  </div>
                  <div className="grid gap-1">
                    <label className="text-xs opacity-70">Fill</label>
                    <input type="color" className="w-full h-10 bg-transparent rounded-lg border border-outline-variant/20 cursor-pointer"
                       value={toColorInputValue(selectedText?.fill, DEFAULT_TEXT_FILL)}
                       onChange={(event) => updateActiveTextStyle({ fill: event.target.value })} />
                  </div>

                  {typographyMode === 'pro' && (
                     <>
                       <div className="flex gap-2 flex-wrap mt-2">
                         <button onClick={() => updateActiveTextStyle({ fontWeight: (selectedText?.fontWeight ?? 400) >= 700 ? 400 : 700 })} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${((selectedText?.fontWeight ?? 400) >= 700) ? 'bg-primary/10 text-primary' : 'bg-surface-container-low text-on-surface'}`}>Bold</button>
                         <button onClick={() => updateActiveTextStyle({ fontStyle: selectedText?.fontStyle === 'italic' ? 'normal' : 'italic' })} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${(selectedText?.fontStyle === 'italic') ? 'bg-primary/10 text-primary' : 'bg-surface-container-low text-on-surface'}`}>Italic</button>
                         <button onClick={() => updateActiveTextStyle({ underline: !(selectedText?.underline ?? false) })} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${(selectedText?.underline ?? false) ? 'bg-primary/10 text-primary' : 'bg-surface-container-low text-on-surface'}`}>Underline</button>
                       </div>
                       <div className="flex gap-2 flex-wrap mt-2">
                         {(['left', 'center', 'right'] as const).map((alignment) => (
                           <button key={alignment} onClick={() => updateActiveTextStyle({ textAlign: alignment })} className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize ${(selectedText?.textAlign === alignment) ? 'bg-primary/10 text-primary' : 'bg-surface-container-low text-on-surface'}`}>{alignment}</button>
                         ))}
                       </div>
                     </>
                  )}
                </div>
              ) : propertiesMode === 'shape' ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs opacity-70 m-0">Shape properties</p>
                    <h3 className="m-0 mt-1 text-sm font-bold">{selectedShape?.name ?? 'No shape selected'}</h3>
                  </div>
                  <div className="grid gap-1">
                    <label className="text-xs opacity-70">Fill</label>
                    <input type="color" className="w-full h-10 bg-transparent rounded-lg border border-outline-variant/20 cursor-pointer"
                       value={toColorInputValue(selectedShape?.fill, DEFAULT_SHAPE_FILL)}
                       onChange={(event) => updateSelectedShapeStyle({ fill: event.target.value })} />
                  </div>
                  <div className="grid gap-1">
                    <label className="text-xs opacity-70">Stroke</label>
                    <input type="color" className="w-full h-10 bg-transparent rounded-lg border border-outline-variant/20 cursor-pointer"
                       value={toColorInputValue(selectedShape?.stroke?.color, DEFAULT_SHAPE_STROKE_COLOR)}
                       onChange={(event) => updateSelectedShapeStyle({ strokeColor: event.target.value })} />
                  </div>
                  <div className="grid gap-1">
                    <label className="text-xs opacity-70">Stroke width</label>
                    <input type="number" min={1} max={32} className="w-full bg-surface-container-low rounded-lg border border-outline-variant/20 px-3 py-2 text-sm text-on-surface"
                       value={selectedShape?.stroke?.width ?? DEFAULT_SHAPE_STROKE_WIDTH}
                       onChange={(event) => updateSelectedShapeStyle({ strokeWidth: clampStrokeWidth(Number.parseInt(event.target.value, 10) || 1) })} />
                  </div>
                </div>
              ) : propertiesMode === 'image' ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs opacity-70 m-0">Image properties</p>
                    <h3 className="m-0 mt-1 text-sm font-bold">{selectedImage?.name ?? 'No image selected'}</h3>
                  </div>
                  <div className="p-3 bg-surface-container-low border border-outline-variant/10 rounded-xl">
                    <p className="text-xs opacity-70 m-0">Placed size</p>
                    <p className="font-mono text-sm m-0 mt-1">{selectedImage ? `${Math.round(selectedImage.width)} x ${Math.round(selectedImage.height)}px` : 'Pending'}</p>
                  </div>
                  <div className="p-3 bg-surface-container-low border border-outline-variant/10 rounded-xl">
                    <p className="text-xs opacity-70 m-0">Intrinsic size</p>
                    <p className="font-mono text-sm m-0 mt-1">{selectedImage ? `${selectedImage.intrinsicWidth} x ${selectedImage.intrinsicHeight}px` : 'Pending'}</p>
                  </div>
                  <div className="p-3 bg-surface-container-low border border-outline-variant/10 rounded-xl">
                    <p className="text-xs opacity-70 m-0">Upload status</p>
                    <p className="font-mono text-sm m-0 mt-1">{imageUploadStatus === 'error' ? (imageUploadError ?? 'error') : imageUploadStatus}</p>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-sm font-bold m-0 mb-2 text-on-surface">No element selected</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Use the Text, Image, or shape tools, or select an element from the canvas or list below.
                  </p>
                </div>
              )}
              
              <hr className="border-outline-variant/20 my-6" />
              
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3">Layers</p>
                {(document?.elements ?? []).map((element) => (
                  <button
                    key={element.id}
                    type="button"
                    onClick={() => {
                      selectElement(element.id);
                      if (element.type !== 'text' && textEditingElementId) {
                        stopTextEditing();
                      }
                    }}
                    onDoubleClick={() => {
                      if (element.type === 'text') {
                        setTextEditingElementId(element.id);
                      }
                    }}
                    className={`w-full text-left p-3 rounded-xl transition-all border ${element.id === selectedElementId ? 'bg-primary/10 border-primary/30 text-primary shadow-sm' : 'bg-surface-container-low hover:bg-surface-container border-transparent text-on-surface'}`}
                  >
                    <div className="flex justify-between items-center gap-3">
                      <strong className="text-sm font-bold truncate">{element.name}</strong>
                      <span className="text-[9px] uppercase tracking-widest font-bold opacity-60 bg-white/50 px-1.5 py-0.5 rounded">{element.type}</span>
                    </div>
                  </button>
                ))}
              </div>

            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col bg-surface-dim relative overflow-hidden">
          <nav className="w-full bg-white/90 backdrop-blur-md border-b border-surface-container px-6 py-2 flex items-center gap-4 z-30">
            <div className="flex items-center gap-4 ml-auto text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">speed</span> {benchmarkAverage === null ? 'Pending' : `${benchmarkAverage.toFixed(2)}ms`}</span>
              <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">memory</span> Renders: {renderDetail.renderCount}</span>
            </div>
          </nav>

          <div className="absolute bottom-12 right-6 flex items-center bg-white/80 backdrop-blur-xl rounded-full px-4 py-2 gap-4 z-40 shadow-sm border border-outline-variant/10">
            <div className="flex items-center gap-2">
              <button className="p-1 hover:text-primary transition-colors flex items-center justify-center" onClick={() => {
                      rendererRef.current?.zoomBy(1 / 1.15, {
                        x: stageSize.width / 2,
                        y: stageSize.height / 2,
                      });
                      syncViewportFromRenderer();
                    }}>
                <span className="material-symbols-outlined text-sm">zoom_out</span>
              </button>
              <span className="text-xs font-bold w-12 text-center">{Math.round(zoomPercent)}%</span>
              <button className="p-1 hover:text-primary transition-colors flex items-center justify-center" onClick={() => {
                      rendererRef.current?.zoomBy(1.15, {
                        x: stageSize.width / 2,
                        y: stageSize.height / 2,
                      });
                      syncViewportFromRenderer();
                    }}>
                <span className="material-symbols-outlined text-sm">zoom_in</span>
              </button>
            </div>
            <div className="h-4 w-px bg-surface-container-highest"></div>
            <button className="p-1 hover:text-primary transition-colors flex items-center justify-center" onClick={fitRendererToViewport}>
              <span className="material-symbols-outlined text-sm">fullscreen</span>
            </button>
          </div>

          <div className="flex-1 w-full h-full overflow-hidden relative custom-scrollbar flex items-center justify-center p-8 bg-surface-dim">
             <div
              onDragOver={handleStageDragOver}
              onDragEnter={handleStageDragOver}
              onDragLeave={handleStageDragLeave}
              onDrop={handleStageDrop}
              ref={stageViewportRef}
              className="w-full h-full relative"
              style={{
                outline: isDragOver ? '3px dashed rgba(245, 158, 11, 0.85)' : 'none',
                outlineOffset: '-6px',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => {
                  void handleFileInputChange(event);
                }}
                className="hidden"
              />
              <canvas
                ref={canvasRef}
                aria-label="Design canvas stage"
                onWheel={handleWheel}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerCancel}
                onLostPointerCapture={handlePointerCancel}
                className="block touch-none"
                style={{
                  cursor: isPanning
                    ? 'grabbing'
                    : isSpacePressed
                      ? 'grab'
                      : activeTool === 'text'
                        ? 'text'
                        : activeTool === 'image'
                          ? 'copy'
                        : isShapeTool(activeTool)
                          ? 'crosshair'
                          : 'default',
                }}
              />
              {editingText ? (
                <TextEditorOverlay
                  element={editingText}
                  zoom={zoomPercent / 100}
                  pan={pan}
                  onChange={(text) => updateTextElementContent(editingText.id, text)}
                  onStopEditing={stopTextEditing}
                />
              ) : null}
              
              <div style={{ position: 'absolute' }}>
                {imageUploadStatus !== 'idle' && (
                  <div className={`absolute right-4 top-4 max-w-[340px] rounded-[18px] px-4 py-3 text-sm text-white shadow-xl ${imageUploadStatus === 'error' ? 'bg-red-700/95' : imageUploadStatus === 'success' ? 'bg-green-700/95' : 'bg-slate-800/95'}`}>
                    {imageUploadStatus === 'loading'
                        ? 'Uploading image asset and preparing signed canvas URL...'
                        : imageUploadStatus === 'success'
                          ? 'Image asset uploaded and placed on the canvas.'
                          : imageUploadError}
                  </div>
                )}
              </div>
            </div>
          </div>

          <footer className="h-8 bg-surface-container px-4 flex flex-shrink-0 items-center justify-between text-[10px] text-on-surface-variant/70 font-medium z-30">
            <div className="flex items-center gap-4">
              <span>{document ? `${document.name} (${document.canvas.width} x ${document.canvas.height}px)` : 'Loading...'}</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-secondary"></span> All changes saved</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="hover:text-on-surface cursor-pointer">Help Center</span>
              <span className="hover:text-on-surface cursor-pointer">Keyboard Shortcuts</span>
            </div>
          </footer>
        </main>
      </div>
      
      <NewDesignDialog
        isOpen={isNewDesignDialogOpen}
        width={newDesignWidth}
        height={newDesignHeight}
        onWidthChange={(width) => setNewDesignDimensions({ width, height: newDesignHeight })}
        onHeightChange={(height) => setNewDesignDimensions({ width: newDesignWidth, height })}
        onClose={closeNewDesignDialog}
        onCreate={handleCreateNewDesign}
      />
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div
      style={{
        padding: '0.9rem 1rem',
        borderRadius: '18px',
        background: 'rgba(255, 255, 255, 0.8)',
        border: '1px solid rgba(122, 85, 38, 0.16)',
      }}
    >
      <p style={{ margin: 0, fontSize: '0.78rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {label}
      </p>
      <strong
        style={{
          display: 'block',
          marginTop: '0.35rem',
          fontSize: '1.25rem',
          color: '#1f2937',
          textTransform: typeof value === 'string' ? 'capitalize' : undefined,
        }}
      >
        {value}
      </strong>
    </div>
  );
}

function ToolbarButton({
  label,
  onClick,
  active = false,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: active ? '1px solid rgba(17, 24, 39, 0.88)' : '1px solid rgba(122, 85, 38, 0.18)',
        borderRadius: '999px',
        background: active ? '#1f2937' : 'rgba(255, 255, 255, 0.78)',
        color: active ? '#f9fafb' : '#1f2937',
        padding: '0.78rem 1rem',
        fontSize: '0.92rem',
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}

function ModeButton({
  label,
  onClick,
  active,
}: {
  label: string;
  onClick: () => void;
  active: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: active ? '1px solid rgba(245, 158, 11, 0.6)' : '1px solid rgba(255, 255, 255, 0.16)',
        borderRadius: '999px',
        background: active ? 'rgba(245, 158, 11, 0.16)' : 'rgba(255, 255, 255, 0.04)',
        color: '#f8fafc',
        padding: '0.55rem 0.85rem',
        fontSize: '0.84rem',
        cursor: 'pointer',
        textTransform: 'capitalize',
      }}
    >
      {label}
    </button>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: '0.95rem',
        borderRadius: '18px',
        background: 'rgba(255, 255, 255, 0.08)',
      }}
    >
      <p style={{ margin: 0, fontSize: '0.84rem', opacity: 0.72 }}>{label}</p>
      <p style={{ margin: '0.35rem 0 0', fontFamily: 'monospace' }}>{value}</p>
    </div>
  );
}

const fieldStyle = {
  display: 'grid',
  gap: '0.35rem',
} as const;

const fieldLabelStyle = {
  fontSize: '0.84rem',
  opacity: 0.72,
} as const;

const buttonRowStyle = {
  display: 'flex',
  gap: '0.5rem',
  flexWrap: 'wrap',
} as const;

const colorInputStyle = {
  width: '100%',
  minHeight: '2.75rem',
  borderRadius: '12px',
  border: '1px solid rgba(255, 255, 255, 0.16)',
  background: 'transparent',
  cursor: 'pointer',
} as const;

const numberInputStyle = {
  width: '100%',
  borderRadius: '12px',
  border: '1px solid rgba(255, 255, 255, 0.16)',
  background: 'rgba(255, 255, 255, 0.04)',
  color: '#f8fafc',
  padding: '0.75rem 0.85rem',
} as const;
