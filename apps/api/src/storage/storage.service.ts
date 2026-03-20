import { randomUUID, createHash, createHmac } from 'node:crypto';
import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { validateEnv } from '@design-editor/common-types';

import { PrepareImageUploadDto } from './dto/prepare-image-upload.dto';

const SUPPORTED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const UPLOAD_URL_TTL_MS = 15 * 60 * 1000;
const READ_URL_TTL_MS = 60 * 60 * 1000;
const DEV_USER_ID = 'dev-user';

type SignedAssetTokenPayload = {
  assetId: string;
  expiresAt: string;
  key: string;
  purpose: 'upload' | 'read';
  contentType?: string;
};

type UploadedImageFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
};

@Injectable()
export class StorageService {
  private readonly env = validateEnv('api');

  prepareImageUpload(dto: PrepareImageUploadDto): {
    assetId: string;
    contentType: string;
    uploadUrl: string;
    readUrl: string;
    readUrlExpiresAt: string;
  } {
    if (!SUPPORTED_IMAGE_MIME_TYPES.has(dto.contentType)) {
      throw new BadRequestException('Only JPG, PNG, and WebP image uploads are supported.');
    }

    const assetId = randomUUID();
    const storageKey = getStorageKey(assetId);
    const uploadExpiresAt = new Date(Date.now() + UPLOAD_URL_TTL_MS).toISOString();
    const readUrlDetails = this.createSignedReadUrl(assetId);

    return {
      assetId,
      contentType: dto.contentType,
      uploadUrl: this.createSignedAssetUrl(`/api/v1/storage/image-assets/${assetId}/upload`, {
        assetId,
        contentType: dto.contentType,
        expiresAt: uploadExpiresAt,
        key: storageKey,
        purpose: 'upload',
      }),
      readUrl: readUrlDetails.readUrl,
      readUrlExpiresAt: readUrlDetails.readUrlExpiresAt,
    };
  }

  createSignedReadUrl(assetId: string): {
    readUrl: string;
    readUrlExpiresAt: string;
  } {
    const readExpiresAt = new Date(Date.now() + READ_URL_TTL_MS).toISOString();

    return {
      readUrl: this.createSignedAssetUrl(`/api/v1/storage/image-assets/${assetId}/file`, {
        assetId,
        expiresAt: readExpiresAt,
        key: getStorageKey(assetId),
        purpose: 'read',
      }),
      readUrlExpiresAt: readExpiresAt,
    };
  }

  async uploadPreparedImage(assetId: string, token: string | undefined, file: UploadedImageFile): Promise<void> {
    const payload = this.verifySignedToken(token, 'upload', assetId);
    if (!payload.contentType) {
      throw new UnauthorizedException('Signed upload token is missing the expected content type.');
    }

    if (!file?.buffer?.length) {
      throw new BadRequestException('Image upload requires a non-empty file.');
    }

    if (!SUPPORTED_IMAGE_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException('Only JPG, PNG, and WebP image uploads are supported.');
    }

    if (file.mimetype !== payload.contentType) {
      throw new BadRequestException('Uploaded file type does not match the prepared image asset request.');
    }

    await this.putObject(payload.key, file.buffer, payload.contentType);
  }

  async readImageAsset(assetId: string, token: string | undefined): Promise<{
    buffer: Buffer;
    contentType: string;
  }> {
    const payload = this.verifySignedToken(token, 'read', assetId);

    return this.getObject(payload.key, payload.contentType ?? 'application/octet-stream');
  }

  private createSignedAssetUrl(pathname: string, payload: SignedAssetTokenPayload): string {
    const token = signPayload(payload, this.env.JWT_SECRET);

    return `${this.env.API_URL}${pathname}?token=${encodeURIComponent(token)}`;
  }

  private verifySignedToken(
    token: string | undefined,
    expectedPurpose: SignedAssetTokenPayload['purpose'],
    expectedAssetId: string,
  ): SignedAssetTokenPayload {
    if (!token) {
      throw new UnauthorizedException('Missing signed asset token.');
    }

    const payload = verifySignedPayload<SignedAssetTokenPayload>(token, this.env.JWT_SECRET);

    if (payload.purpose !== expectedPurpose || payload.assetId !== expectedAssetId) {
      throw new UnauthorizedException('Signed asset token does not match the requested image asset operation.');
    }

    if (Date.parse(payload.expiresAt) <= Date.now()) {
      throw new UnauthorizedException('Signed asset URL has expired.');
    }

    return payload;
  }

  private async putObject(key: string, buffer: Buffer, contentType: string): Promise<void> {
    const response = await this.s3Request('PUT', key, {
      body: buffer,
      contentType,
    });

    if (!response.ok) {
      throw new BadRequestException(`Image asset upload failed with status ${response.status}.`);
    }
  }

  private async getObject(
    key: string,
    fallbackContentType: string,
  ): Promise<{
    buffer: Buffer;
    contentType: string;
  }> {
    const response = await this.s3Request('GET', key);

    if (response.status === 404) {
      throw new NotFoundException('Image asset not found.');
    }

    if (!response.ok) {
      throw new BadRequestException(`Image asset download failed with status ${response.status}.`);
    }

    return {
      buffer: Buffer.from(await response.arrayBuffer()),
      contentType: response.headers.get('content-type') ?? fallbackContentType,
    };
  }

  private async s3Request(
    method: 'GET' | 'PUT',
    key: string,
    options: {
      body?: Buffer;
      contentType?: string;
    } = {},
  ): Promise<Response> {
    const url = buildS3ObjectUrl(this.env.S3_ENDPOINT, this.env.S3_BUCKET, key);
    const body = options.body ?? Buffer.alloc(0);
    const payloadHash = sha256Hex(body);
    const amzDate = toAmzDate(new Date());
    const dateStamp = amzDate.slice(0, 8);
    const headers = new Map<string, string>([
      ['host', url.host],
      ['x-amz-content-sha256', payloadHash],
      ['x-amz-date', amzDate],
    ]);

    if (options.contentType) {
      headers.set('content-type', options.contentType);
    }

    const canonicalHeaders = Array.from(headers.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([name, value]) => `${name}:${normalizeHeaderValue(value)}\n`)
      .join('');
    const signedHeaders = Array.from(headers.keys())
      .sort((left, right) => left.localeCompare(right))
      .join(';');
    const canonicalRequest = [
      method,
      url.pathname,
      '',
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join('\n');
    const credentialScope = `${dateStamp}/${this.env.S3_REGION}/s3/aws4_request`;
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      sha256Hex(Buffer.from(canonicalRequest, 'utf8')),
    ].join('\n');
    const signingKey = getSignatureKey(this.env.S3_SECRET_KEY, dateStamp, this.env.S3_REGION, 's3');
    const signature = createHmac('sha256', signingKey)
      .update(stringToSign, 'utf8')
      .digest('hex');
    const authorization = [
      `AWS4-HMAC-SHA256 Credential=${this.env.S3_ACCESS_KEY}/${credentialScope}`,
      `SignedHeaders=${signedHeaders}`,
      `Signature=${signature}`,
    ].join(', ');

    const requestHeaders = new Headers();
    for (const [name, value] of headers.entries()) {
      requestHeaders.set(name, value);
    }
    requestHeaders.set('Authorization', authorization);

    return fetch(url, {
      method,
      headers: requestHeaders,
      body: method === 'PUT' ? new Uint8Array(body) : undefined,
    });
  }
}

function buildS3ObjectUrl(endpoint: string, bucket: string, key: string): URL {
  const normalizedEndpoint = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;
  const encodedKey = key
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');

  return new URL(`${normalizedEndpoint}/${encodeURIComponent(bucket)}/${encodedKey}`);
}

function signPayload(payload: SignedAssetTokenPayload, secret: string): string {
  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signature = createHmac('sha256', secret)
    .update(encodedPayload, 'utf8')
    .digest('base64url');

  return `${encodedPayload}.${signature}`;
}

function verifySignedPayload<TPayload>(token: string, secret: string): TPayload {
  const [encodedPayload, signature] = token.split('.');

  if (!encodedPayload || !signature) {
    throw new UnauthorizedException('Malformed signed asset token.');
  }

  const expectedSignature = createHmac('sha256', secret)
    .update(encodedPayload, 'utf8')
    .digest('base64url');

  if (signature !== expectedSignature) {
    throw new UnauthorizedException('Invalid signed asset token.');
  }

  return JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as TPayload;
}

function getStorageKey(assetId: string): string {
  return `assets/${DEV_USER_ID}/${assetId}`;
}

function normalizeHeaderValue(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function sha256Hex(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex');
}

function toAmzDate(date: Date): string {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, '');
}

function getSignatureKey(secretAccessKey: string, dateStamp: string, region: string, service: string): Buffer {
  const kDate = createHmac('sha256', `AWS4${secretAccessKey}`).update(dateStamp, 'utf8').digest();
  const kRegion = createHmac('sha256', kDate).update(region, 'utf8').digest();
  const kService = createHmac('sha256', kRegion).update(service, 'utf8').digest();

  return createHmac('sha256', kService).update('aws4_request', 'utf8').digest();
}
