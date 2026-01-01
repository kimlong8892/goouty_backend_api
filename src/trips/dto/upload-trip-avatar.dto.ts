import { ApiProperty } from '@nestjs/swagger';

export class UploadTripAvatarDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Trip avatar image file (max 5MB)',
  })
  avatar: Express.Multer.File;
}

export class UploadTripAvatarResponseDto {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({
    description: 'Upload result data',
    properties: {
      url: { type: 'string', description: 'S3 URL of uploaded avatar' },
      key: { type: 'string', description: 'S3 key for the uploaded file' },
      bucket: { type: 'string', description: 'S3 bucket name' },
    },
  })
  data: {
    url: string;
    key: string;
    bucket: string;
  };
}
