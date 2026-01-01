import { ApiProperty } from '@nestjs/swagger';

export class UploadDataDto {
  @ApiProperty({ description: 'URL of the uploaded file' })
  url: string;

  @ApiProperty({ description: 'S3 key of the uploaded file' })
  key: string;

  @ApiProperty({ description: 'S3 bucket name' })
  bucket: string;

  @ApiProperty({ description: 'File size in bytes', required: false })
  size?: number;

  @ApiProperty({ description: 'File content type', required: false })
  contentType?: string;
}

export class UploadResponseDto {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'Upload data', type: UploadDataDto })
  data: UploadDataDto;
}

export class DeleteResponseDto {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'S3 key of the deleted file' })
  key: string;
}

export class BulkDeleteResponseDto {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'Array of delete results' })
  results: DeleteResponseDto[];
}

export class FileMetadataDto {
  @ApiProperty({ description: 'S3 key of the file' })
  key: string;

  @ApiProperty({ description: 'File size in bytes' })
  size: number;

  @ApiProperty({ description: 'File content type' })
  contentType: string;

  @ApiProperty({ description: 'Last modified date' })
  lastModified: Date;

  @ApiProperty({ description: 'ETag of the file' })
  etag: string;
}

export class FileExistsDto {
  @ApiProperty({ description: 'Whether the file exists' })
  exists: boolean;

  @ApiProperty({ description: 'S3 key of the file' })
  key: string;
}

export class PresignedUrlDto {
  @ApiProperty({ description: 'Presigned URL for file access' })
  url: string;

  @ApiProperty({ description: 'S3 key of the file' })
  key: string;

  @ApiProperty({ description: 'Expiration time in seconds' })
  expiresIn: number;
}

export class ServiceInfoDto {
  @ApiProperty({ description: 'S3 bucket name' })
  bucket: string;

  @ApiProperty({ description: 'Environment' })
  environment: string;

  @ApiProperty({ description: 'S3 region' })
  region: string;

  @ApiProperty({ description: 'S3 endpoint' })
  endpoint: string;
}
