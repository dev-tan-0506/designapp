import type { CanvasElement, DesignDocument } from '@design-editor/common-types';
import { create } from 'zustand';

type ElementDelta = {
  x: number;
  y: number;
};

type DocumentStoreState = {
  document: DesignDocument | null;
  seedDocument: (documentId: string) => void;
  setDocument: (document: DesignDocument) => void;
  addElement: (element: CanvasElement) => void;
  moveElements: (elementIds: string[], delta: ElementDelta) => void;
  resizeElement: (elementId: string, width: number, height: number) => void;
};

function createSeedDocument(documentId: string): DesignDocument {
  return {
    id: documentId,
    name: `Design ${documentId}`,
    canvas: {
      width: 1200,
      height: 800,
      backgroundColor: '#fffdf8',
    },
    selectedElementIds: [],
    updatedAt: new Date().toISOString(),
    elements: [
      {
        id: 'rect-hero',
        name: 'Hero Rect',
        type: 'rect',
        x: 100,
        y: 80,
        width: 280,
        height: 180,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        fill: '#115e59',
        cornerRadius: 24,
      },
      {
        id: 'ellipse-accent',
        name: 'Accent Ellipse',
        type: 'ellipse',
        x: 430,
        y: 120,
        width: 180,
        height: 180,
        rotation: -10,
        opacity: 0.9,
        visible: true,
        locked: false,
        fill: '#f97316',
      },
      {
        id: 'text-title',
        name: 'Title',
        type: 'text',
        x: 120,
        y: 320,
        width: 520,
        height: 120,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        text: 'Canvas renderer foundation',
        fontFamily: 'Georgia',
        fontSize: 42,
        fontWeight: 700,
        fontStyle: 'normal',
        textAlign: 'left',
        fill: '#1f2937',
        lineHeight: 1.1,
      },
      {
        id: 'image-placeholder',
        name: 'Image Placeholder',
        type: 'image',
        x: 700,
        y: 100,
        width: 360,
        height: 240,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        src: 'seed://image-placeholder',
        alt: 'Preview Image',
        intrinsicWidth: 1440,
        intrinsicHeight: 960,
      },
      {
        id: 'group-1',
        name: 'Group Overlay',
        type: 'group',
        x: 80,
        y: 60,
        width: 1010,
        height: 420,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        childIds: ['rect-hero', 'ellipse-accent', 'text-title', 'image-placeholder'],
      },
    ],
  };
}

function withUpdatedTimestamp(document: DesignDocument): DesignDocument {
  return {
    ...document,
    updatedAt: new Date().toISOString(),
  };
}

export const useDocumentStore = create<DocumentStoreState>((set) => ({
  document: null,
  seedDocument: (documentId) => {
    set({
      document: createSeedDocument(documentId),
    });
  },
  setDocument: (document) => {
    set({
      document: withUpdatedTimestamp(document),
    });
  },
  addElement: (element) => {
    set((state) => {
      if (!state.document) {
        return state;
      }

      return {
        document: withUpdatedTimestamp({
          ...state.document,
          elements: [...state.document.elements, element],
        }),
      };
    });
  },
  moveElements: (elementIds, delta) => {
    set((state) => {
      if (!state.document) {
        return state;
      }

      return {
        document: withUpdatedTimestamp({
          ...state.document,
          elements: state.document.elements.map((element) =>
            elementIds.includes(element.id)
              ? {
                  ...element,
                  x: element.x + delta.x,
                  y: element.y + delta.y,
                }
              : element,
          ),
        }),
      };
    });
  },
  resizeElement: (elementId, width, height) => {
    set((state) => {
      if (!state.document) {
        return state;
      }

      return {
        document: withUpdatedTimestamp({
          ...state.document,
          elements: state.document.elements.map((element) =>
            element.id === elementId
              ? {
                  ...element,
                  width,
                  height,
                }
              : element,
          ),
        }),
      };
    });
  },
}));
