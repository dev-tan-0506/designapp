import { IsIn, IsString, MinLength } from 'class-validator';

const SUPPORTED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export class PrepareImageUploadDto {
  @IsString()
  @MinLength(1)
  fileName!: string;

  @IsString()
  @IsIn(SUPPORTED_IMAGE_MIME_TYPES)
  contentType!: (typeof SUPPORTED_IMAGE_MIME_TYPES)[number];
}
