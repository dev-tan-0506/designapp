'use client';

import React, { useEffect, useRef } from 'react';
import type { CanvasPoint, TextElement } from '@design-editor/common-types';

type TextEditorOverlayProps = {
  element: TextElement;
  zoom: number;
  pan: CanvasPoint;
  onChange: (text: string) => void;
  onStopEditing: () => void;
};

export function TextEditorOverlay({
  element,
  zoom,
  pan,
  onChange,
  onStopEditing,
}: TextEditorOverlayProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.focus();
    textarea.select();
  }, [element.id]);

  return (
    <textarea
      ref={textareaRef}
      aria-label="Text element editor"
      value={element.text}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          onStopEditing();
        }
      }}
      onPointerDown={(event) => {
        event.stopPropagation();
      }}
      spellCheck={false}
      style={{
        position: 'absolute',
        left: element.x * zoom + pan.x,
        top: element.y * zoom + pan.y,
        width: Math.max(160, element.width * zoom),
        height: Math.max(56, element.height * zoom),
        padding: `${Math.max(8, 12 * zoom)}px`,
        borderRadius: '16px',
        border: '2px solid rgba(245, 158, 11, 0.65)',
        background: 'rgba(255, 255, 255, 0.92)',
        color: element.fill,
        fontFamily: element.fontFamily,
        fontSize: `${Math.max(12, element.fontSize * zoom)}px`,
        fontWeight: element.fontWeight,
        fontStyle: element.fontStyle,
        lineHeight: element.lineHeight,
        textAlign: element.textAlign,
        textDecoration: element.underline ? 'underline' : 'none',
        resize: 'none',
        overflow: 'hidden',
        outline: 'none',
        boxShadow: '0 18px 40px rgba(15, 23, 42, 0.18)',
        zIndex: 2,
      }}
    />
  );
}
