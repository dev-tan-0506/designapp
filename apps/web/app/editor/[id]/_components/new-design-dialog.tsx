'use client';

import React, { type CSSProperties } from 'react';

type NewDesignDialogProps = {
  isOpen: boolean;
  width: number;
  height: number;
  onWidthChange: (width: number) => void;
  onHeightChange: (height: number) => void;
  onClose: () => void;
  onCreate: () => void;
};

function normalizeDimensionValue(value: string): number {
  const parsed = Number.parseInt(value, 10);

  return Number.isFinite(parsed) ? Math.max(1, parsed) : 1;
}

export function NewDesignDialog({
  isOpen,
  width,
  height,
  onWidthChange,
  onHeightChange,
  onClose,
  onCreate,
}: NewDesignDialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      aria-modal="true"
      role="dialog"
      style={overlayStyle}
      onClick={onClose}
    >
      <div
        style={panelStyle}
        onClick={(event) => event.stopPropagation()}
      >
        <div>
          <p style={eyebrowStyle}>Story 1.3</p>
          <h2 style={headingStyle}>New design</h2>
          <p style={copyStyle}>Create a fresh in-memory canvas with custom pixel dimensions.</p>
        </div>

        <div style={fieldGridStyle}>
          <label style={fieldStyle}>
            <span style={fieldLabelStyle}>Width (px)</span>
            <input
              min={1}
              type="number"
              value={width}
              onChange={(event) => onWidthChange(normalizeDimensionValue(event.target.value))}
              style={inputStyle}
            />
          </label>
          <label style={fieldStyle}>
            <span style={fieldLabelStyle}>Height (px)</span>
            <input
              min={1}
              type="number"
              value={height}
              onChange={(event) => onHeightChange(normalizeDimensionValue(event.target.value))}
              style={inputStyle}
            />
          </label>
        </div>

        <div style={actionsStyle}>
          <button
            type="button"
            onClick={onClose}
            style={secondaryButtonStyle}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onCreate}
            style={primaryButtonStyle}
          >
            Create canvas
          </button>
        </div>
      </div>
    </div>
  );
}

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(15, 23, 42, 0.4)',
  display: 'grid',
  placeItems: 'center',
  padding: '1.5rem',
  zIndex: 20,
};

const panelStyle: CSSProperties = {
  width: 'min(420px, 100%)',
  borderRadius: '24px',
  background: '#fffdf8',
  border: '1px solid rgba(122, 85, 38, 0.18)',
  boxShadow: '0 28px 80px rgba(15, 23, 42, 0.18)',
  padding: '1.5rem',
  display: 'grid',
  gap: '1rem',
};

const eyebrowStyle: CSSProperties = {
  margin: 0,
  fontSize: '0.78rem',
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  color: '#8c5a25',
};

const headingStyle: CSSProperties = {
  margin: '0.4rem 0 0',
  fontSize: '1.6rem',
  color: '#111827',
};

const copyStyle: CSSProperties = {
  margin: '0.5rem 0 0',
  color: '#4b5563',
  lineHeight: 1.5,
};

const fieldGridStyle: CSSProperties = {
  display: 'grid',
  gap: '1rem',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
};

const fieldStyle: CSSProperties = {
  display: 'grid',
  gap: '0.45rem',
};

const fieldLabelStyle: CSSProperties = {
  fontSize: '0.9rem',
  color: '#374151',
};

const inputStyle: CSSProperties = {
  borderRadius: '14px',
  border: '1px solid rgba(148, 163, 184, 0.6)',
  padding: '0.8rem 0.9rem',
  fontSize: '1rem',
};

const actionsStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '0.75rem',
  flexWrap: 'wrap',
};

const primaryButtonStyle: CSSProperties = {
  border: 'none',
  borderRadius: '999px',
  background: '#111827',
  color: '#f9fafb',
  padding: '0.85rem 1.15rem',
  fontSize: '0.95rem',
  fontWeight: 600,
  cursor: 'pointer',
};

const secondaryButtonStyle: CSSProperties = {
  border: '1px solid rgba(148, 163, 184, 0.55)',
  borderRadius: '999px',
  background: '#ffffff',
  color: '#111827',
  padding: '0.85rem 1.15rem',
  fontSize: '0.95rem',
  fontWeight: 600,
  cursor: 'pointer',
};
