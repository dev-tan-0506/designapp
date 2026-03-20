import { beforeEach, describe, expect, it } from 'vitest';

import { useDocumentStore } from './use-document-store';
import { useUIStore } from './use-ui-store';

describe('useUIStore', () => {
  beforeEach(() => {
    useDocumentStore.setState({
      document: null,
    });
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
  });

  it('tracks viewport state separately from document content', () => {
    useUIStore.getState().setViewport(250, { x: 32, y: -18 });

    expect(useUIStore.getState().zoomPercent).toBe(250);
    expect(useUIStore.getState().pan).toEqual({ x: 32, y: -18 });
  });

  it('opens the new design dialog with a seeded canvas size', () => {
    useUIStore.getState().openNewDesignDialog({ width: 1600, height: 900 });

    expect(useUIStore.getState().isNewDesignDialogOpen).toBe(true);
    expect(useUIStore.getState().newDesignWidth).toBe(1600);
    expect(useUIStore.getState().newDesignHeight).toBe(900);
  });

  it('updates viewport state without mutating the current design document', () => {
    useDocumentStore.getState().seedDocument('story-1-3');
    const beforeViewportChange = JSON.stringify(useDocumentStore.getState().document);

    useUIStore.getState().setViewport(175, { x: 48, y: -32 });

    expect(useUIStore.getState().zoomPercent).toBe(175);
    expect(useUIStore.getState().pan).toEqual({ x: 48, y: -32 });
    expect(JSON.stringify(useDocumentStore.getState().document)).toBe(beforeViewportChange);
  });

  it('tracks the active shape tool separately from document content', () => {
    useDocumentStore.getState().seedDocument('story-1-4');
    const beforeToolChange = JSON.stringify(useDocumentStore.getState().document);

    useUIStore.getState().setActiveTool('rectangle');

    expect(useUIStore.getState().activeTool).toBe('rectangle');
    expect(JSON.stringify(useDocumentStore.getState().document)).toBe(beforeToolChange);
  });

  it('tracks text editing state and typography mode separately from document content', () => {
    useDocumentStore.getState().seedDocument('story-1-5');
    const beforeUiChange = JSON.stringify(useDocumentStore.getState().document);

    useUIStore.getState().setActiveTool('text');
    useUIStore.getState().setTextEditingElementId('text-title');
    useUIStore.getState().setTypographyMode('pro');
    useUIStore.getState().setFontSearchQuery('inter');
    useUIStore.getState().setFontSearchStatus('loading');

    expect(useUIStore.getState().activeTool).toBe('text');
    expect(useUIStore.getState().textEditingElementId).toBe('text-title');
    expect(useUIStore.getState().typographyMode).toBe('pro');
    expect(useUIStore.getState().fontSearchQuery).toBe('inter');
    expect(useUIStore.getState().fontSearchStatus).toBe('loading');
    expect(JSON.stringify(useDocumentStore.getState().document)).toBe(beforeUiChange);
  });

  it('tracks image tool and upload status separately from committed document content', () => {
    useDocumentStore.getState().seedDocument('story-1-6');
    const beforeUiChange = JSON.stringify(useDocumentStore.getState().document);

    useUIStore.getState().setActiveTool('image');
    useUIStore.getState().setImageUploadState('loading');
    useUIStore.getState().setImageUploadState('error', 'Unsupported file format');

    expect(useUIStore.getState().activeTool).toBe('image');
    expect(useUIStore.getState().imageUploadStatus).toBe('error');
    expect(useUIStore.getState().imageUploadError).toBe('Unsupported file format');
    expect(JSON.stringify(useDocumentStore.getState().document)).toBe(beforeUiChange);
  });
});
