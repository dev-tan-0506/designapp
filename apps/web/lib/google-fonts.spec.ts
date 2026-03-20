/** @vitest-environment jsdom */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  GoogleFontsConfigurationError,
  loadGoogleFontFamily,
  resetGoogleFontsCache,
  searchGoogleFonts,
} from './google-fonts';

describe('google-fonts helpers', () => {
  beforeEach(() => {
    resetGoogleFontsCache();
    document.head.innerHTML = '';
  });

  it('caches Google Fonts search results for repeated queries', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          {
            family: 'Roboto',
            category: 'sans-serif',
            variants: ['400', '700'],
            subsets: ['latin'],
          },
          {
            family: 'Roboto Condensed',
            category: 'sans-serif',
            variants: ['400', '700'],
            subsets: ['latin'],
          },
        ],
      }),
    } as Response);

    const firstResult = await searchGoogleFonts('roboto', {
      apiKey: 'test-key',
      fetcher,
    });
    const secondResult = await searchGoogleFonts('roboto', {
      apiKey: 'test-key',
      fetcher,
    });

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(firstResult).toEqual(secondResult);
    expect(firstResult).toHaveLength(2);
  });

  it('requires an API key to search the full Google Fonts catalog', async () => {
    await expect(
      searchGoogleFonts('mont', {
        apiKey: undefined,
      }),
    ).rejects.toBeInstanceOf(GoogleFontsConfigurationError);
  });

  it('loads a Google Font stylesheet once and waits for document fonts', async () => {
    const load = vi.fn().mockResolvedValue([]);
    const fonts = {
      load,
      ready: Promise.resolve([]),
    };
    Object.defineProperty(document, 'fonts', {
      value: fonts,
      configurable: true,
    });

    await loadGoogleFontFamily('Open Sans', {
      documentRef: document,
    });
    await loadGoogleFontFamily('Open Sans', {
      documentRef: document,
    });

    expect(document.head.querySelectorAll('link[data-google-font-family="Open Sans"]')).toHaveLength(1);
    expect(load).toHaveBeenCalledTimes(2);
  });
});
