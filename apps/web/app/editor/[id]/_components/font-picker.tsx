'use client';

import React, { useEffect, useState } from 'react';

import {
  searchGoogleFonts,
  type GoogleFontFamily,
} from '../../../../lib/google-fonts';

import type { AsyncStatus } from '../../../../stores/use-ui-store';

type FontPickerProps = {
  apiKey?: string;
  query: string;
  status: AsyncStatus;
  selectedFamily: string;
  isCatalogConfigured: boolean;
  onQueryChange: (query: string) => void;
  onStatusChange: (status: AsyncStatus) => void;
  onSelectFamily: (family: string) => void | Promise<void>;
};

export function FontPicker({
  apiKey,
  query,
  status,
  selectedFamily,
  isCatalogConfigured,
  onQueryChange,
  onStatusChange,
  onSelectFamily,
}: FontPickerProps) {
  const [results, setResults] = useState<GoogleFontFamily[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    const timeout = window.setTimeout(async () => {
      onStatusChange('loading');
      setErrorMessage(null);

      try {
        const nextResults = await searchGoogleFonts(query, {
          apiKey,
        });

        if (!isActive) {
          return;
        }

        setResults(nextResults);
        onStatusChange('success');
      } catch (error) {
        if (!isActive) {
          return;
        }

        setResults([]);
        setErrorMessage(error instanceof Error ? error.message : 'Unable to search Google Fonts.');
        onStatusChange('error');
      }
    }, 160);

    return () => {
      isActive = false;
      window.clearTimeout(timeout);
    };
  }, [apiKey, onStatusChange, query]);

  return (
    <div style={{ display: 'grid', gap: '0.65rem' }}>
      <label style={{ display: 'grid', gap: '0.35rem' }}>
        <span style={{ fontSize: '0.84rem', opacity: 0.72 }}>Font family</span>
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search Google Fonts"
          style={pickerInputStyle}
        />
      </label>
      <div
        style={{
          display: 'grid',
          gap: '0.5rem',
          maxHeight: '220px',
          overflowY: 'auto',
        }}
      >
        {results.map((font) => (
          <button
            key={font.family}
            type="button"
            onClick={() => void onSelectFamily(font.family)}
            style={{
              ...pickerOptionStyle,
              borderColor:
                selectedFamily === font.family ? 'rgba(245, 158, 11, 0.65)' : 'rgba(255, 255, 255, 0.12)',
              background:
                selectedFamily === font.family
                  ? 'rgba(245, 158, 11, 0.14)'
                  : 'rgba(255, 255, 255, 0.04)',
              fontFamily: font.family,
            }}
          >
            <span>{font.family}</span>
            <span style={{ opacity: 0.58, fontSize: '0.78rem' }}>{font.category}</span>
          </button>
        ))}
      </div>
      {!isCatalogConfigured ? (
        <p style={pickerMessageStyle}>
          Add `NEXT_PUBLIC_GOOGLE_FONTS_API_KEY` to search the full Google Fonts catalog.
        </p>
      ) : null}
      {status === 'loading' ? <p style={pickerMessageStyle}>Searching fonts...</p> : null}
      {status === 'success' && results.length === 0 ? (
        <p style={pickerMessageStyle}>No Google Fonts matched this query.</p>
      ) : null}
      {errorMessage ? <p style={pickerMessageStyle}>{errorMessage}</p> : null}
    </div>
  );
}

const pickerInputStyle = {
  width: '100%',
  borderRadius: '12px',
  border: '1px solid rgba(255, 255, 255, 0.16)',
  background: 'rgba(255, 255, 255, 0.04)',
  color: '#f8fafc',
  padding: '0.75rem 0.85rem',
} as const;

const pickerOptionStyle = {
  borderWidth: '1px',
  borderStyle: 'solid',
  borderRadius: '14px',
  color: '#f8fafc',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0.7rem 0.8rem',
  cursor: 'pointer',
} as const;

const pickerMessageStyle = {
  margin: 0,
  fontSize: '0.82rem',
  opacity: 0.72,
} as const;
