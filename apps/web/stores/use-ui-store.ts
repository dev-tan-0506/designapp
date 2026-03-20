import type { CanvasPoint, CanvasSize } from '@design-editor/common-types';
import { create } from 'zustand';

const DEFAULT_STAGE_SIZE: CanvasSize = {
  width: 1200,
  height: 800,
};

export type ActiveTool = 'select' | 'rectangle' | 'ellipse' | 'text' | 'image';
export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';
export type TypographyMode = 'simple' | 'pro';

type UIStoreState = {
  zoomPercent: number;
  pan: CanvasPoint;
  stageSize: CanvasSize;
  activeTool: ActiveTool;
  textEditingElementId: string | null;
  typographyMode: TypographyMode;
  fontSearchQuery: string;
  fontSearchStatus: AsyncStatus;
  imageUploadStatus: AsyncStatus;
  imageUploadError: string | null;
  isNewDesignDialogOpen: boolean;
  newDesignWidth: number;
  newDesignHeight: number;
  setViewport: (zoomPercent: number, pan: CanvasPoint) => void;
  setStageSize: (stageSize: CanvasSize) => void;
  setActiveTool: (tool: ActiveTool) => void;
  setTextEditingElementId: (elementId: string | null) => void;
  setTypographyMode: (mode: TypographyMode) => void;
  setFontSearchQuery: (query: string) => void;
  setFontSearchStatus: (status: AsyncStatus) => void;
  setImageUploadState: (status: AsyncStatus, error?: string | null) => void;
  openNewDesignDialog: (canvasSize?: CanvasSize) => void;
  closeNewDesignDialog: () => void;
  setNewDesignDimensions: (canvasSize: CanvasSize) => void;
};

export const useUIStore = create<UIStoreState>((set) => ({
  zoomPercent: 100,
  pan: { x: 0, y: 0 },
  stageSize: DEFAULT_STAGE_SIZE,
  activeTool: 'select',
  textEditingElementId: null,
  typographyMode: 'simple',
  fontSearchQuery: '',
  fontSearchStatus: 'idle',
  imageUploadStatus: 'idle',
  imageUploadError: null,
  isNewDesignDialogOpen: false,
  newDesignWidth: DEFAULT_STAGE_SIZE.width,
  newDesignHeight: DEFAULT_STAGE_SIZE.height,
  setViewport: (zoomPercent, pan) => {
    set({
      zoomPercent,
      pan,
    });
  },
  setStageSize: (stageSize) => {
    set({
      stageSize,
    });
  },
  setActiveTool: (activeTool) => {
    set({
      activeTool,
    });
  },
  setTextEditingElementId: (textEditingElementId) => {
    set({
      textEditingElementId,
    });
  },
  setTypographyMode: (typographyMode) => {
    set({
      typographyMode,
    });
  },
  setFontSearchQuery: (fontSearchQuery) => {
    set({
      fontSearchQuery,
    });
  },
  setFontSearchStatus: (fontSearchStatus) => {
    set({
      fontSearchStatus,
    });
  },
  setImageUploadState: (imageUploadStatus, imageUploadError = null) => {
    set({
      imageUploadStatus,
      imageUploadError,
    });
  },
  openNewDesignDialog: (canvasSize) => {
    set({
      isNewDesignDialogOpen: true,
      newDesignWidth: canvasSize?.width ?? DEFAULT_STAGE_SIZE.width,
      newDesignHeight: canvasSize?.height ?? DEFAULT_STAGE_SIZE.height,
    });
  },
  closeNewDesignDialog: () => {
    set({
      isNewDesignDialogOpen: false,
    });
  },
  setNewDesignDimensions: (canvasSize) => {
    set({
      newDesignWidth: canvasSize.width,
      newDesignHeight: canvasSize.height,
    });
  },
}));
