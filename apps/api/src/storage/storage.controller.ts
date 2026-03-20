import { StreamableFile, Body, Controller, Get, Param, Post, Query, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { PrepareImageUploadDto } from './dto/prepare-image-upload.dto';
import { StorageService } from './storage.service';

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('image-assets/prepare')
  prepareImageUpload(@Body() dto: PrepareImageUploadDto) {
    return {
      data: this.storageService.prepareImageUpload(dto),
    };
  }

  @Post('image-assets/:assetId/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPreparedImage(
    @Param('assetId') assetId: string,
    @Query('token') token: string | undefined,
    @UploadedFile()
    file: {
      buffer: Buffer;
      mimetype: string;
      originalname: string;
    },
  ) {
    await this.storageService.uploadPreparedImage(assetId, token, file);

    return {
      data: {
        assetId,
        uploaded: true,
      },
    };
  }

  @Get('image-assets/:assetId/read-url')
  getSignedReadUrl(@Param('assetId') assetId: string) {
    return {
      data: this.storageService.createSignedReadUrl(assetId),
    };
  }

  @Get('image-assets/:assetId/file')
  async readImageAsset(
    @Param('assetId') assetId: string,
    @Query('token') token: string | undefined,
    @Res({ passthrough: true }) response: {
      setHeader: (name: string, value: string) => void;
    },
  ) {
    const file = await this.storageService.readImageAsset(assetId, token);

    response.setHeader('Content-Type', file.contentType);
    response.setHeader('Cache-Control', 'private, max-age=3600');

    return new StreamableFile(file.buffer);
  }
}
