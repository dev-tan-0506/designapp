/** @vitest-environment jsdom */

import { describe, expect, it, vi } from 'vitest';

import {
  UnsupportedImageUploadError,
  refreshImageAssetReadUrl,
  uploadImageAsset,
} from './image-upload';

describe('uploadImageAsset', () => {
  it('rejects unsupported file formats before calling the API', async () => {
    const fetcher = vi.fn<typeof fetch>();

    await expect(
      uploadImageAsset(new File(['notes'], 'notes.txt', { type: 'text/plain' }), {
        apiUrl: 'http://localhost:3001',
        fetcher,
      }),
    ).rejects.toBeInstanceOf(UnsupportedImageUploadError);

    expect(fetcher).not.toHaveBeenCalled();
  });

  it('prepares, uploads, and returns intrinsic image metadata for supported files', async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            assetId: 'asset-1',
            contentType: 'image/png',
            uploadUrl: 'http://localhost:3001/api/v1/storage/image-assets/asset-1/upload?token=upload-token',
            readUrl: 'http://localhost:3001/api/v1/storage/image-assets/asset-1/file?token=read-token',
            readUrlExpiresAt: '2026-03-20T17:00:00.000Z',
          },
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
      } as Response);

    const result = await uploadImageAsset(
      new File(['png-bytes'], 'hero-banner.png', { type: 'image/png' }),
      {
        apiUrl: 'http://localhost:3001',
        fetcher,
        measureImage: async () => ({
          width: 1920,
          height: 1080,
        }),
      },
    );

    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls[0]?.[0]).toBe('http://localhost:3001/api/v1/storage/image-assets/prepare');
    expect(fetcher.mock.calls[1]?.[0]).toBe(
      'http://localhost:3001/api/v1/storage/image-assets/asset-1/upload?token=upload-token',
    );
    expect(fetcher.mock.calls[1]?.[1]).toMatchObject({
      method: 'POST',
    });
    expect(result).toEqual({
      assetId: 'asset-1',
      src: 'http://localhost:3001/api/v1/storage/image-assets/asset-1/file?token=read-token',
      alt: 'hero-banner',
      intrinsicWidth: 1920,
      intrinsicHeight: 1080,
      readUrlExpiresAt: '2026-03-20T17:00:00.000Z',
    });
  });

  it('refreshes a signed read URL for an uploaded image asset', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          readUrl: 'http://localhost:3001/api/v1/storage/image-assets/asset-1/file?token=fresh-token',
          readUrlExpiresAt: '2026-03-20T18:00:00.000Z',
        },
      }),
    } as Response);

    const result = await refreshImageAssetReadUrl('asset-1', {
      apiUrl: 'http://localhost:3001',
      fetcher,
    });

    expect(fetcher).toHaveBeenCalledWith(
      'http://localhost:3001/api/v1/storage/image-assets/asset-1/read-url',
    );
    expect(result).toEqual({
      readUrl: 'http://localhost:3001/api/v1/storage/image-assets/asset-1/file?token=fresh-token',
      readUrlExpiresAt: '2026-03-20T18:00:00.000Z',
    });
  });
});
