import type {
  CanvasElement,
  DesignDocument,
  EllipseElement,
  ImageElement,
  RectElement,
  TextElement,
} from '@design-editor/common-types';
import { create } from 'zustand';

type ElementDelta = {
  x: number;
  y: number;
};

type ElementFrame = Pick<CanvasElement, 'x' | 'y' | 'width' | 'height'>;
type ZOrderAction = 'bring-forward' | 'send-backward' | 'bring-to-front' | 'send-to-back';

type DocumentStoreState = {
  document: DesignDocument | null;
  seedDocument: (documentId: string) => void;
  createDocument: (documentId: string, width: number, height: number) => void;
  setDocument: (document: DesignDocument) => void;
  selectElement: (elementId: string | null) => void;
  addElement: (element: CanvasElement) => void;
  commitShapeElement: (element: RectElement | EllipseElement) => void;
  commitTextElement: (element: TextElement) => void;
  commitImageElement: (element: ImageElement) => void;
  updateImageElementSource: (
    elementId: string,
    source: Pick<ImageElement, 'src' | 'readUrlExpiresAt'>,
  ) => void;
  updateTextElementContent: (elementId: string, text: string) => void;
  updateTextElementStyle: (elementId: string, style: TextStylePatch) => void;
  updateSelectedTextContent: (text: string) => void;
  updateSelectedTextStyle: (style: TextStylePatch) => void;
  updateSelectedShapeStyle: (style: ShapeStylePatch) => void;
  moveElement: (elementId: string, delta: ElementDelta) => void;
  moveElements: (elementIds: string[], delta: ElementDelta) => void;
  resizeElement: (elementId: string, frame: ElementFrame) => void;
  rotateElement: (elementId: string, rotation: number) => void;
  reorderElement: (elementId: string, action: ZOrderAction) => void;
};

type ShapeStylePatch = {
  fill?: string;
  strokeColor?: string;
  strokeWidth?: number;
};

type TextStylePatch = {
  fill?: string;
  fontFamily?: string;
  fontSize?: number;
  fontStyle?: TextElement['fontStyle'];
  fontWeight?: number;
  textAlign?: TextElement['textAlign'];
  underline?: boolean;
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
        underline: false,
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

function createBlankDocument(documentId: string, width: number, height: number): DesignDocument {
  return {
    id: documentId,
    name: `Design ${documentId}`,
    canvas: {
      width,
      height,
      backgroundColor: '#fffdf8',
    },
    selectedElementIds: [],
    updatedAt: new Date().toISOString(),
    elements: [],
  };
}

function withUpdatedTimestamp(document: DesignDocument): DesignDocument {
  return {
    ...document,
    updatedAt: new Date().toISOString(),
  };
}

function estimateTextBounds(text: string, fontSize: number, lineHeight: number): Pick<TextElement, 'width' | 'height'> {
  const lines = text.split('\n');
  const longestLineLength = Math.max(...lines.map((line) => line.length), 1);

  return {
    width: Math.min(720, Math.max(160, Math.round(longestLineLength * fontSize * 0.62 + 24))),
    height: Math.max(56, Math.round(lines.length * fontSize * lineHeight + 20)),
  };
}

function updateTextElementCollection(
  elements: DesignDocument['elements'],
  elementId: string,
  updater: (element: TextElement) => TextElement,
): DesignDocument['elements'] {
  return elements.map((element) => {
    if (element.id !== elementId || element.type !== 'text') {
      return element;
    }

    return updater(element);
  });
}

function moveElementInOrder(elements: DesignDocument['elements'], elementId: string, action: ZOrderAction) {
  const index = elements.findIndex((element) => element.id === elementId);
  if (index === -1) {
    return elements;
  }

  const nextElements = [...elements];
  const [targetElement] = nextElements.splice(index, 1);

  if (!targetElement) {
    return elements;
  }

  let nextIndex = index;

  switch (action) {
    case 'bring-forward':
      nextIndex = Math.min(nextElements.length, index + 1);
      break;
    case 'send-backward':
      nextIndex = Math.max(0, index - 1);
      break;
    case 'bring-to-front':
      nextIndex = nextElements.length;
      break;
    case 'send-to-back':
      nextIndex = 0;
      break;
  }

  nextElements.splice(nextIndex, 0, targetElement);

  return nextElements;
}

export const useDocumentStore = create<DocumentStoreState>((set) => ({
  document: null,
  seedDocument: (documentId) => {
    set({
      document: createSeedDocument(documentId),
    });
  },
  createDocument: (documentId, width, height) => {
    set({
      document: createBlankDocument(documentId, width, height),
    });
  },
  setDocument: (document) => {
    set({
      document: withUpdatedTimestamp(document),
    });
  },
  selectElement: (elementId) => {
    set((state) => {
      if (!state.document) {
        return state;
      }

      return {
        document: withUpdatedTimestamp({
          ...state.document,
          selectedElementIds: elementId ? [elementId] : [],
        }),
      };
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
  commitShapeElement: (element) => {
    set((state) => {
      if (!state.document) {
        return state;
      }

      return {
        document: withUpdatedTimestamp({
          ...state.document,
          elements: [...state.document.elements, element],
          selectedElementIds: [element.id],
        }),
      };
    });
  },
  commitTextElement: (element) => {
    set((state) => {
      if (!state.document) {
        return state;
      }

      return {
        document: withUpdatedTimestamp({
          ...state.document,
          elements: [...state.document.elements, element],
          selectedElementIds: [element.id],
        }),
      };
    });
  },
  commitImageElement: (element) => {
    set((state) => {
      if (!state.document) {
        return state;
      }

      return {
        document: withUpdatedTimestamp({
          ...state.document,
          elements: [...state.document.elements, element],
          selectedElementIds: [element.id],
        }),
      };
    });
  },
  updateImageElementSource: (elementId, source) => {
    set((state) => {
      if (!state.document) {
        return state;
      }

      return {
        document: withUpdatedTimestamp({
          ...state.document,
          elements: state.document.elements.map((element) => {
            if (element.id !== elementId || element.type !== 'image') {
              return element;
            }

            return {
              ...element,
              src: source.src,
              readUrlExpiresAt: source.readUrlExpiresAt,
            };
          }),
        }),
      };
    });
  },
  updateTextElementContent: (elementId, text) => {
    set((state) => {
      if (!state.document) {
        return state;
      }

      return {
        document: withUpdatedTimestamp({
          ...state.document,
          elements: updateTextElementCollection(state.document.elements, elementId, (element) => ({
            ...element,
            text,
            ...estimateTextBounds(text, element.fontSize, element.lineHeight),
          })),
        }),
      };
    });
  },
  updateTextElementStyle: (elementId, style) => {
    set((state) => {
      if (!state.document) {
        return state;
      }

      return {
        document: withUpdatedTimestamp({
          ...state.document,
          elements: updateTextElementCollection(state.document.elements, elementId, (element) => {
            const nextFontSize = style.fontSize ?? element.fontSize;
            const nextLineHeight = element.lineHeight;

            return {
              ...element,
              fill: style.fill ?? element.fill,
              fontFamily: style.fontFamily ?? element.fontFamily,
              fontSize: nextFontSize,
              fontStyle: style.fontStyle ?? element.fontStyle,
              fontWeight: style.fontWeight ?? element.fontWeight,
              textAlign: style.textAlign ?? element.textAlign,
              underline: style.underline ?? element.underline ?? false,
              ...estimateTextBounds(element.text, nextFontSize, nextLineHeight),
            };
          }),
        }),
      };
    });
  },
  updateSelectedTextContent: (text) => {
    set((state) => {
      if (!state.document) {
        return state;
      }

      const selectedElementId = state.document.selectedElementIds[0];
      if (!selectedElementId) {
        return state;
      }

      return {
        document: withUpdatedTimestamp({
          ...state.document,
          elements: updateTextElementCollection(state.document.elements, selectedElementId, (element) => ({
            ...element,
            text,
            ...estimateTextBounds(text, element.fontSize, element.lineHeight),
          })),
        }),
      };
    });
  },
  updateSelectedTextStyle: (style) => {
    set((state) => {
      if (!state.document) {
        return state;
      }

      const selectedElementId = state.document.selectedElementIds[0];
      if (!selectedElementId) {
        return state;
      }

      return {
        document: withUpdatedTimestamp({
          ...state.document,
          elements: updateTextElementCollection(state.document.elements, selectedElementId, (element) => {
            const nextFontSize = style.fontSize ?? element.fontSize;
            const nextLineHeight = element.lineHeight;

            return {
              ...element,
              fill: style.fill ?? element.fill,
              fontFamily: style.fontFamily ?? element.fontFamily,
              fontSize: nextFontSize,
              fontStyle: style.fontStyle ?? element.fontStyle,
              fontWeight: style.fontWeight ?? element.fontWeight,
              textAlign: style.textAlign ?? element.textAlign,
              underline: style.underline ?? element.underline ?? false,
              ...estimateTextBounds(element.text, nextFontSize, nextLineHeight),
            };
          }),
        }),
      };
    });
  },
  updateSelectedShapeStyle: (style) => {
    set((state) => {
      if (!state.document) {
        return state;
      }

      const selectedElementId = state.document.selectedElementIds[0];
      if (!selectedElementId) {
        return state;
      }

      return {
        document: withUpdatedTimestamp({
          ...state.document,
          elements: state.document.elements.map((element) => {
            if (element.id !== selectedElementId) {
              return element;
            }

            if (element.type !== 'rect' && element.type !== 'ellipse') {
              return element;
            }

            const existingStroke = element.stroke ?? {
              color: '#1f2937',
              width: 1,
            };

            return {
              ...element,
              fill: style.fill ?? element.fill,
              stroke: {
                color: style.strokeColor ?? existingStroke.color,
                width: style.strokeWidth ?? existingStroke.width,
              },
            };
          }),
        }),
      };
    });
  },
  moveElement: (elementId, delta) => {
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
                  x: element.x + delta.x,
                  y: element.y + delta.y,
                }
              : element,
          ),
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
  resizeElement: (elementId, frame) => {
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
                  x: frame.x,
                  y: frame.y,
                  width: frame.width,
                  height: frame.height,
                }
              : element,
          ),
        }),
      };
    });
  },
  rotateElement: (elementId, rotation) => {
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
                  rotation,
                }
              : element,
          ),
        }),
      };
    });
  },
  reorderElement: (elementId, action) => {
    set((state) => {
      if (!state.document) {
        return state;
      }

      return {
        document: withUpdatedTimestamp({
          ...state.document,
          elements: moveElementInOrder(state.document.elements, elementId, action),
          selectedElementIds: [elementId],
        }),
      };
    });
  },
}));
