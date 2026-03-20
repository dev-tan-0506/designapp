const SUPPORTED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export class UnsupportedImageUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnsupportedImageUploadError';
  }
}

type PreparedImageUploadResponse = {
  assetId: string;
  contentType: string;
  uploadUrl: string;
  readUrl: string;
  readUrlExpiresAt: string;
};

type RefreshImageReadUrlResponse = {
  readUrl: string;
  readUrlExpiresAt: string;
};

type UploadImageAssetOptions = {
  apiUrl?: string;
  fetcher?: typeof fetch;
  measureImage?: (file: File) => Promise<{ width: number; height: number }>;
};

export type UploadedImageAsset = {
  assetId: string;
  src: string;
  alt: string;
  intrinsicWidth: number;
  intrinsicHeight: number;
  readUrlExpiresAt: string;
};

type RefreshImageReadUrlOptions = {
  apiUrl?: string;
  fetcher?: typeof fetch;
};

export async function uploadImageAsset(
  file: File,
  options: UploadImageAssetOptions = {},
): Promise<UploadedImageAsset> {
  if (!SUPPORTED_IMAGE_MIME_TYPES.has(file.type)) {
    throw new UnsupportedImageUploadError('Only JPG, PNG, and WebP image uploads are supported.');
  }

  const apiUrl = options.apiUrl ?? process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    throw new Error('NEXT_PUBLIC_API_URL is required to upload image assets.');
  }

  const fetcher = options.fetcher ?? fetch;
  const measureImage = options.measureImage ?? getImageDimensions;
  const dimensions = await measureImage(file);
  const prepared = await prepareImageUpload(apiUrl, file, fetcher);

  const formData = new FormData();
  formData.append('file', file);

  const uploadResponse = await fetcher(prepared.uploadUrl, {
    method: 'POST',
    body: formData,
  });

  if (!uploadResponse.ok) {
    throw new Error(`Image upload failed with status ${uploadResponse.status}`);
  }

  return {
    assetId: prepared.assetId,
    src: prepared.readUrl,
    alt: toAltText(file.name),
    intrinsicWidth: dimensions.width,
    intrinsicHeight: dimensions.height,
    readUrlExpiresAt: prepared.readUrlExpiresAt,
  };
}

export async function refreshImageAssetReadUrl(
  assetId: string,
  options: RefreshImageReadUrlOptions = {},
): Promise<RefreshImageReadUrlResponse> {
  const apiUrl = options.apiUrl ?? process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    throw new Error('NEXT_PUBLIC_API_URL is required to refresh image asset URLs.');
  }

  const fetcher = options.fetcher ?? fetch;
  const response = await fetcher(`${apiUrl}/api/v1/storage/image-assets/${assetId}/read-url`);

  if (!response.ok) {
    throw new Error(`Image read URL refresh failed with status ${response.status}`);
  }

  const payload = (await response.json()) as {
    data: RefreshImageReadUrlResponse;
  };

  return payload.data;
}

async function prepareImageUpload(
  apiUrl: string,
  file: File,
  fetcher: typeof fetch,
): Promise<PreparedImageUploadResponse> {
  const response = await fetcher(`${apiUrl}/api/v1/storage/image-assets/prepare`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type,
    }),
  });

  if (!response.ok) {
    throw new Error(`Image upload prepare failed with status ${response.status}`);
  }

  const payload = (await response.json()) as {
    data: PreparedImageUploadResponse;
  };

  return payload.data;
}

async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const image = new Image();

      image.addEventListener('load', () => {
        resolve({
          width: image.naturalWidth,
          height: image.naturalHeight,
        });
      });
      image.addEventListener('error', () => {
        reject(new Error('Unable to decode uploaded image.'));
      });
      image.src = objectUrl;
    });

    return dimensions;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function toAltText(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, '').trim() || 'uploaded-image';
}
