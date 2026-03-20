export type CanvasPoint = {
  x: number;
  y: number;
};

export type CanvasSize = {
  width: number;
  height: number;
};

export type CanvasBounds = CanvasPoint & CanvasSize;

export type ElementType = 'rect' | 'ellipse' | 'text' | 'image' | 'group';

export type BaseCanvasElement = {
  id: string;
  name: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
};

export type StrokeStyle = {
  color: string;
  width: number;
};

export type RectElement = BaseCanvasElement & {
  type: 'rect';
  fill: string;
  stroke?: StrokeStyle;
  cornerRadius: number;
};

export type EllipseElement = BaseCanvasElement & {
  type: 'ellipse';
  fill: string;
  stroke?: StrokeStyle;
};

export type TextElement = BaseCanvasElement & {
  type: 'text';
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  fontStyle: 'normal' | 'italic';
  underline?: boolean;
  textAlign: CanvasTextAlign;
  fill: string;
  lineHeight: number;
};

export type ImageElement = BaseCanvasElement & {
  type: 'image';
  src: string;
  alt: string;
  assetId?: string;
  intrinsicWidth: number;
  intrinsicHeight: number;
  readUrlExpiresAt?: string;
};

export type GroupElement = BaseCanvasElement & {
  type: 'group';
  childIds: string[];
};

export type CanvasElement =
  | RectElement
  | EllipseElement
  | TextElement
  | ImageElement
  | GroupElement;

export type DesignCanvas = CanvasSize & {
  backgroundColor: string;
};

export type DesignDocument = {
  id: string;
  name: string;
  canvas: DesignCanvas;
  elements: CanvasElement[];
  selectedElementIds: string[];
  updatedAt: string;
};
