import { BadRequestException } from '@nestjs/common';

import { StorageService } from './storage.service';

describe('StorageService', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/design_editor';
    process.env.REDIS_URL = 'redis://localhost:6379';
    process.env.S3_ENDPOINT = 'http://localhost:4566';
    process.env.S3_BUCKET = 'design-editor-dev';
    process.env.S3_REGION = 'us-east-1';
    process.env.S3_ACCESS_KEY = 'test';
    process.env.S3_SECRET_KEY = 'test';
    process.env.JWT_SECRET = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    process.env.JWT_REFRESH_SECRET = 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789';
    process.env.JWT_ACCESS_EXPIRY = '15m';
    process.env.JWT_REFRESH_EXPIRY = '30d';
    process.env.GOOGLE_CLIENT_ID = 'google-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'google-client-secret';
    process.env.GOOGLE_CALLBACK_URL = 'http://localhost:3001/api/v1/auth/google/callback';
    process.env.SENDGRID_API_KEY = 'sendgrid-key';
    process.env.API_URL = 'http://localhost:3001';
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('prepares signed upload and read URLs for supported image uploads', () => {
    const service = new StorageService();

    const prepared = service.prepareImageUpload({
      fileName: 'Hero Banner.PNG',
      contentType: 'image/png',
    });

    expect(prepared.assetId).toHaveLength(36);
    expect(prepared.uploadUrl).toContain('/api/v1/storage/image-assets/');
    expect(prepared.uploadUrl).toContain('/upload?token=');
    expect(prepared.readUrl).toContain('/file?token=');
    expect(Date.parse(prepared.readUrlExpiresAt) - Date.now()).toBeGreaterThan(59 * 60 * 1000);
  });

  it('rejects unsupported content types during prepare', () => {
    const service = new StorageService();

    expect(() =>
      service.prepareImageUpload({
        fileName: 'notes.txt',
        contentType: 'text/plain',
      }),
    ).toThrow(BadRequestException);
  });

  it('uploads original file bytes to the configured S3-compatible endpoint', async () => {
    const service = new StorageService();
    const prepared = service.prepareImageUpload({
      fileName: 'mock-image.png',
      contentType: 'image/png',
    });
    const uploadUrl = new URL(prepared.uploadUrl);
    const fetchMock = jest.fn<typeof fetch>().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      arrayBuffer: async () => new ArrayBuffer(0),
    } as Response);
    global.fetch = fetchMock;

    await service.uploadPreparedImage(prepared.assetId, uploadUrl.searchParams.get('token') ?? undefined, {
      buffer: Buffer.from('image-binary'),
      mimetype: 'image/png',
      originalname: 'mock-image.png',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0].toString()).toContain('/design-editor-dev/assets/dev-user/');
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      method: 'PUT',
    });
  });

  it('can mint a fresh signed read URL for an existing image asset', () => {
    const service = new StorageService();
    const prepared = service.prepareImageUpload({
      fileName: 'gallery-shot.webp',
      contentType: 'image/webp',
    });

    const refreshed = service.createSignedReadUrl(prepared.assetId);

    expect(refreshed.readUrl).toContain(`/api/v1/storage/image-assets/${prepared.assetId}/file?token=`);
    expect(Date.parse(refreshed.readUrlExpiresAt) - Date.now()).toBeGreaterThan(59 * 60 * 1000);
  });
});
