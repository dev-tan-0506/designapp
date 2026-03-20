export type GoogleFontFamily = {
  family: string;
  category: string;
  variants: string[];
  subsets: string[];
};

export class GoogleFontsConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GoogleFontsConfigurationError';
  }
}

type SearchGoogleFontsOptions = {
  apiKey?: string;
  fetcher?: typeof fetch;
  limit?: number;
  signal?: AbortSignal;
};

type LoadGoogleFontOptions = {
  documentRef?: Document;
};

const GOOGLE_FONTS_API_ENDPOINT = 'https://www.googleapis.com/webfonts/v1/webfonts';
const GOOGLE_FONTS_CSS_ENDPOINT = 'https://fonts.googleapis.com/css2';

let catalogPromise: Promise<GoogleFontFamily[]> | null = null;
let catalogCacheKey = '';
const queryCache = new Map<string, GoogleFontFamily[]>();
const loadedFontFamilies = new Set<string>();

export async function searchGoogleFonts(
  query: string,
  options: SearchGoogleFontsOptions = {},
): Promise<GoogleFontFamily[]> {
  if (!options.apiKey) {
    throw new GoogleFontsConfigurationError(
      'Configure NEXT_PUBLIC_GOOGLE_FONTS_API_KEY to search the full Google Fonts catalog.',
    );
  }

  const normalizedQuery = query.trim().toLowerCase();
  const cacheKey = `${options.apiKey}:${normalizedQuery}:${options.limit ?? 12}`;

  const cachedResult = queryCache.get(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }

  const catalog = await getGoogleFontsCatalog(options);
  const filteredCatalog =
    normalizedQuery.length === 0
      ? catalog
      : catalog.filter((font) => font.family.toLowerCase().includes(normalizedQuery));
  const result = filteredCatalog.slice(0, options.limit ?? 12);

  queryCache.set(cacheKey, result);
  return result;
}

export async function loadGoogleFontFamily(
  fontFamily: string,
  options: LoadGoogleFontOptions = {},
): Promise<void> {
  const documentRef = options.documentRef ?? document;
  if (loadedFontFamilies.has(fontFamily)) {
    return;
  }

  const existingLink = documentRef.head.querySelector<HTMLLinkElement>(
    `link[data-google-font-family="${fontFamily}"]`,
  );
  if (!existingLink) {
    const link = documentRef.createElement('link');
    link.rel = 'stylesheet';
    link.href = buildGoogleFontStylesheetUrl(fontFamily);
    link.dataset.googleFontFamily = fontFamily;
    documentRef.head.appendChild(link);
  }

  if (documentRef.fonts?.load) {
    await documentRef.fonts.load(`16px ${toCssFontFamily(fontFamily)}`);
    await documentRef.fonts.load(`italic 16px ${toCssFontFamily(fontFamily)}`);
    await documentRef.fonts.ready;
  }

  loadedFontFamilies.add(fontFamily);
}

export function resetGoogleFontsCache(): void {
  catalogPromise = null;
  catalogCacheKey = '';
  queryCache.clear();
  loadedFontFamilies.clear();
}

async function getGoogleFontsCatalog(
  options: SearchGoogleFontsOptions,
): Promise<GoogleFontFamily[]> {
  const apiKey = options.apiKey;
  if (!apiKey) {
    throw new GoogleFontsConfigurationError(
      'Configure NEXT_PUBLIC_GOOGLE_FONTS_API_KEY to search the full Google Fonts catalog.',
    );
  }

  const cacheKey = apiKey;
  if (!catalogPromise || catalogCacheKey !== cacheKey) {
    catalogCacheKey = cacheKey;
    catalogPromise = (options.fetcher ?? fetch)(
      `${GOOGLE_FONTS_API_ENDPOINT}?key=${encodeURIComponent(apiKey)}&sort=popularity`,
      {
        signal: options.signal,
      },
    )
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Google Fonts request failed with status ${response.status}`);
        }

        const payload = (await response.json()) as {
          items?: GoogleFontFamily[];
        };

        return payload.items?.map((font) => ({
          family: font.family,
          category: font.category,
          variants: font.variants,
          subsets: font.subsets,
        })) ?? [];
      })
      .catch((error) => {
        catalogPromise = null;
        catalogCacheKey = '';
        throw error;
      });
  }

  return catalogPromise;
}

function buildGoogleFontStylesheetUrl(fontFamily: string): string {
  const familyParam = encodeURIComponent(fontFamily).replace(/%20/g, '+');

  return `${GOOGLE_FONTS_CSS_ENDPOINT}?family=${familyParam}:ital,wght@0,400;0,700;1,400;1,700&display=swap`;
}

function toCssFontFamily(fontFamily: string): string {
  return fontFamily.includes(' ') ? `"${fontFamily}"` : fontFamily;
}
