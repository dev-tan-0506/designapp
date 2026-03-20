import { beforeEach, describe, expect, it } from 'vitest';

import { useDocumentStore } from './use-document-store';

describe('useDocumentStore', () => {
  beforeEach(() => {
    useDocumentStore.setState({
      document: null,
    });
  });

  it('creates a fresh in-memory document with custom canvas dimensions', () => {
    useDocumentStore.getState().createDocument('story-1-3', 1600, 900);

    const document = useDocumentStore.getState().document;

    expect(document?.canvas).toEqual({
      width: 1600,
      height: 900,
      backgroundColor: '#fffdf8',
    });
    expect(document?.elements).toEqual([]);
  });

  it('commits a new shape element and selects it immediately', () => {
    useDocumentStore.getState().createDocument('story-1-4', 1200, 800);

    useDocumentStore.getState().commitShapeElement({
      id: 'shape-1',
      name: 'Rectangle 1',
      type: 'rect',
      x: 40,
      y: 60,
      width: 180,
      height: 120,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      fill: '#22c55e',
      stroke: { color: '#111827', width: 2 },
      cornerRadius: 12,
    });

    const document = useDocumentStore.getState().document;

    expect(document?.elements).toHaveLength(1);
    expect(document?.selectedElementIds).toEqual(['shape-1']);
  });

  it('updates fill and stroke for the selected shape without touching non-shape elements', () => {
    useDocumentStore.getState().seedDocument('story-1-4');
    useDocumentStore.getState().commitShapeElement({
      id: 'shape-2',
      name: 'Ellipse 1',
      type: 'ellipse',
      x: 200,
      y: 180,
      width: 120,
      height: 120,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      fill: '#f97316',
      stroke: { color: '#1f2937', width: 1 },
    });

    useDocumentStore.getState().updateSelectedShapeStyle({
      fill: '#2563eb',
      strokeColor: '#0f172a',
      strokeWidth: 5,
    });

    const document = useDocumentStore.getState().document;
    const updatedShape = document?.elements.find((element) => element.id === 'shape-2');
    const untouchedText = document?.elements.find((element) => element.id === 'text-title');

    expect(updatedShape).toMatchObject({
      fill: '#2563eb',
      stroke: { color: '#0f172a', width: 5 },
    });
    expect(untouchedText?.type).toBe('text');
    if (untouchedText?.type === 'text') {
      expect(untouchedText.fill).toBe('#1f2937');
    }
  });

  it('commits a new text element, selects it, and updates content and typography', () => {
    useDocumentStore.getState().createDocument('story-1-5', 1200, 800);

    useDocumentStore.getState().commitTextElement({
      id: 'text-1',
      name: 'Text 1',
      type: 'text',
      x: 120,
      y: 160,
      width: 260,
      height: 80,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      text: 'Type here',
      fontFamily: 'Inter',
      fontSize: 48,
      fontWeight: 400,
      fontStyle: 'normal',
      underline: false,
      textAlign: 'left',
      fill: '#111827',
      lineHeight: 1.2,
    });

    useDocumentStore.getState().updateSelectedTextContent('Hello world');
    useDocumentStore.getState().updateSelectedTextStyle({
      fontFamily: 'Poppins',
      fontSize: 56,
      fontWeight: 700,
      fontStyle: 'italic',
      underline: true,
      textAlign: 'center',
      fill: '#2563eb',
    });

    const document = useDocumentStore.getState().document;
    const updatedText = document?.elements.find((element) => element.id === 'text-1');

    expect(document?.selectedElementIds).toEqual(['text-1']);
    expect(updatedText).toMatchObject({
      type: 'text',
      text: 'Hello world',
      fontFamily: 'Poppins',
      fontSize: 56,
      fontWeight: 700,
      fontStyle: 'italic',
      underline: true,
      textAlign: 'center',
      fill: '#2563eb',
    });
  });

  it('updates the requested text element by id even when another element is selected', () => {
    useDocumentStore.getState().seedDocument('story-1-5');
    useDocumentStore.getState().commitTextElement({
      id: 'text-2',
      name: 'Text 2',
      type: 'text',
      x: 320,
      y: 420,
      width: 260,
      height: 80,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      text: 'Second text',
      fontFamily: 'Inter',
      fontSize: 36,
      fontWeight: 400,
      fontStyle: 'normal',
      underline: false,
      textAlign: 'left',
      fill: '#111827',
      lineHeight: 1.2,
    });

    useDocumentStore.getState().selectElement('text-title');
    useDocumentStore.getState().updateTextElementContent('text-2', 'Edited while another text is selected');
    useDocumentStore.getState().updateTextElementStyle('text-2', {
      fontFamily: 'Poppins',
      underline: true,
    });

    const document = useDocumentStore.getState().document;
    const unchangedSelectedText = document?.elements.find((element) => element.id === 'text-title');
    const updatedTargetText = document?.elements.find((element) => element.id === 'text-2');

    expect(unchangedSelectedText).toMatchObject({
      type: 'text',
      text: 'Canvas renderer foundation',
      fontFamily: 'Georgia',
    });
    expect(updatedTargetText).toMatchObject({
      type: 'text',
      text: 'Edited while another text is selected',
      fontFamily: 'Poppins',
      underline: true,
    });
  });

  it('commits a new image element with full intrinsic dimensions and selects it immediately', () => {
    useDocumentStore.getState().createDocument('story-1-6', 1200, 800);

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
      src: 'http://localhost:3001/api/v1/storage/image-assets/image-1/file?signature=abc',
      alt: 'uploaded-image',
      assetId: 'image-1',
      intrinsicWidth: 1920,
      intrinsicHeight: 1080,
      readUrlExpiresAt: '2026-03-20T17:00:00.000Z',
    });

    const document = useDocumentStore.getState().document;
    const committedImage = document?.elements.find((element) => element.id === 'image-1');

    expect(document?.selectedElementIds).toEqual(['image-1']);
    expect(committedImage).toMatchObject({
      type: 'image',
      width: 1920,
      height: 1080,
      assetId: 'image-1',
      intrinsicWidth: 1920,
      intrinsicHeight: 1080,
      readUrlExpiresAt: '2026-03-20T17:00:00.000Z',
    });
  });

  it('refreshes the src and expiry for the requested image element by id', () => {
    useDocumentStore.getState().createDocument('story-1-6', 1200, 800);

    useDocumentStore.getState().commitImageElement({
      id: 'image-2',
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
      src: 'http://localhost:3001/api/v1/storage/image-assets/image-2/file?token=stale',
      alt: 'uploaded-image',
      assetId: 'image-2',
      intrinsicWidth: 1920,
      intrinsicHeight: 1080,
      readUrlExpiresAt: '2026-03-20T17:00:00.000Z',
    });

    useDocumentStore.getState().updateImageElementSource('image-2', {
      src: 'http://localhost:3001/api/v1/storage/image-assets/image-2/file?token=fresh',
      readUrlExpiresAt: '2026-03-20T18:00:00.000Z',
    });

    const document = useDocumentStore.getState().document;
    const refreshedImage = document?.elements.find((element) => element.id === 'image-2');

    expect(refreshedImage).toMatchObject({
      type: 'image',
      src: 'http://localhost:3001/api/v1/storage/image-assets/image-2/file?token=fresh',
      readUrlExpiresAt: '2026-03-20T18:00:00.000Z',
    });
  });

  it('moves, resizes, and rotates the selected image without dropping asset metadata', () => {
    useDocumentStore.getState().createDocument('story-1-7', 1200, 800);

    useDocumentStore.getState().commitImageElement({
      id: 'image-transform',
      name: 'Hero image',
      type: 'image',
      x: 200,
      y: 160,
      width: 640,
      height: 360,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      src: 'http://localhost:3001/api/v1/storage/image-assets/image-transform/file?token=abc',
      alt: 'hero',
      assetId: 'asset-transform',
      intrinsicWidth: 1920,
      intrinsicHeight: 1080,
      readUrlExpiresAt: '2026-03-20T19:00:00.000Z',
    });

    useDocumentStore.getState().moveElement('image-transform', { x: 30, y: -20 });
    useDocumentStore.getState().resizeElement('image-transform', {
      x: 180,
      y: 140,
      width: 720,
      height: 405,
    });
    useDocumentStore.getState().rotateElement('image-transform', 45);

    const transformedImage = useDocumentStore
      .getState()
      .document?.elements.find((element) => element.id === 'image-transform');

    expect(transformedImage).toMatchObject({
      type: 'image',
      x: 180,
      y: 140,
      width: 720,
      height: 405,
      rotation: 45,
      assetId: 'asset-transform',
      intrinsicWidth: 1920,
      intrinsicHeight: 1080,
      readUrlExpiresAt: '2026-03-20T19:00:00.000Z',
    });
  });

  it('reorders elements deterministically while keeping the current selection', () => {
    useDocumentStore.getState().seedDocument('story-1-7');

    useDocumentStore.getState().selectElement('rect-hero');
    useDocumentStore.getState().reorderElement('rect-hero', 'bring-to-front');

    let document = useDocumentStore.getState().document;
    expect(document?.elements.at(-1)?.id).toBe('rect-hero');
    expect(document?.selectedElementIds).toEqual(['rect-hero']);

    useDocumentStore.getState().reorderElement('rect-hero', 'send-to-back');

    document = useDocumentStore.getState().document;
    expect(document?.elements[0]?.id).toBe('rect-hero');
    expect(document?.selectedElementIds).toEqual(['rect-hero']);
  });
});
