import {
  Controller,
  Post,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Get,
  Body,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiResponse, ApiBody, ApiQuery } from '@nestjs/swagger';
import { UploadService, UploadOptions } from './upload.service';
import { UploadResponseDto } from './dto/upload-response.dto';
import { UploadFileDto } from './dto/upload-file.dto';

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Upload image to S3 bucket' })
  @ApiConsumes('multipart/form-data')
  @ApiQuery({ name: 'folder', required: false, description: 'Custom folder path' })
  @ApiQuery({ name: 'fileName', required: false, description: 'Custom file name' })
  @ApiBody({
    description: 'Image file to upload',
    type: UploadFileDto,
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'Image file to upload (max 5MB)',
        },
      },
      required: ['image'],
    },
  })
  @ApiResponse({ status: 201, description: 'Image uploaded successfully', type: UploadResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder?: string,
    @Query('fileName') fileName?: string,
  ): Promise<UploadResponseDto> {
    if (!file) throw new BadRequestException('No file provided');

    const options: UploadOptions = {};
    if (folder) options.folder = folder;
    if (fileName) options.fileName = fileName;

    const result = await this.uploadService.uploadImage(file, options);
    return {
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: result.url,
        key: result.key,
        bucket: result.bucket,
      },
    };
  }

  @Post('file')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload any file to S3 bucket' })
  @ApiConsumes('multipart/form-data')
  @ApiQuery({ name: 'folder', required: false, description: 'Custom folder path' })
  @ApiQuery({ name: 'fileName', required: false, description: 'Custom file name' })
  @ApiQuery({ name: 'maxSize', required: false, description: 'Max file size in bytes' })
  @ApiBody({
    description: 'File to upload',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File to upload',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 201, description: 'File uploaded successfully', type: UploadResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder?: string,
    @Query('fileName') fileName?: string,
    @Query('maxSize') maxSize?: string,
  ): Promise<UploadResponseDto> {
    if (!file) throw new BadRequestException('No file provided');

    const options: UploadOptions = {};
    if (folder) options.folder = folder;
    if (fileName) options.fileName = fileName;
    if (maxSize) options.maxSize = parseInt(maxSize);

    const result = await this.uploadService.uploadFile(file, options);
    return {
      success: true,
      message: 'File uploaded successfully',
      data: {
        url: result.url,
        key: result.key,
        bucket: result.bucket,
      },
    };
  }

  @Post('document')
  @UseInterceptors(FileInterceptor('document'))
  @ApiOperation({ summary: 'Upload document to S3 bucket' })
  @ApiConsumes('multipart/form-data')
  @ApiQuery({ name: 'folder', required: false, description: 'Custom folder path' })
  @ApiQuery({ name: 'fileName', required: false, description: 'Custom file name' })
  @ApiBody({
    description: 'Document file to upload',
    schema: {
      type: 'object',
      properties: {
        document: {
          type: 'string',
          format: 'binary',
          description: 'Document file to upload (max 10MB)',
        },
      },
      required: ['document'],
    },
  })
  @ApiResponse({ status: 201, description: 'Document uploaded successfully', type: UploadResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder?: string,
    @Query('fileName') fileName?: string,
  ): Promise<UploadResponseDto> {
    if (!file) throw new BadRequestException('No file provided');

    const options: UploadOptions = {};
    if (folder) options.folder = folder;
    if (fileName) options.fileName = fileName;

    const result = await this.uploadService.uploadDocument(file, options);
    return {
      success: true,
      message: 'Document uploaded successfully',
      data: {
        url: result.url,
        key: result.key,
        bucket: result.bucket,
      },
    };
  }

  @Post('avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiOperation({ summary: 'Upload avatar image to S3 bucket' })
  @ApiConsumes('multipart/form-data')
  @ApiQuery({ name: 'userId', required: false, description: 'User ID for folder organization' })
  @ApiBody({
    description: 'Avatar image file to upload',
    schema: {
      type: 'object',
      properties: {
        avatar: {
          type: 'string',
          format: 'binary',
          description: 'Avatar image file to upload (max 2MB)',
        },
      },
      required: ['avatar'],
    },
  })
  @ApiResponse({ status: 201, description: 'Avatar uploaded successfully', type: UploadResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Query('userId') userId?: string,
  ): Promise<UploadResponseDto> {
    if (!file) throw new BadRequestException('No file provided');

    const result = await this.uploadService.uploadAvatar(file, userId);
    return {
      success: true,
      message: 'Avatar uploaded successfully',
      data: {
        url: result.url,
        key: result.key,
        bucket: result.bucket,
      },
    };
  }

  @Delete('file/:key')
  @ApiOperation({ summary: 'Delete file from S3 bucket' })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async deleteFile(@Param('key') key: string): Promise<{ success: boolean; message: string; key: string }> {
    const result = await this.uploadService.deleteFile(key);
    
    return {
      success: result.success,
      message: 'File deleted successfully',
      key: result.key,
    };
  }

  @Delete('image/:key')
  @ApiOperation({ summary: 'Delete image from S3 bucket' })
  @ApiResponse({ status: 200, description: 'Image deleted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async deleteImage(@Param('key') key: string): Promise<{ success: boolean; message: string; key: string }> {
    const result = await this.uploadService.deleteImage(key);
    
    return {
      success: result.success,
      message: 'Image deleted successfully',
      key: result.key,
    };
  }

  @Delete('files')
  @ApiOperation({ summary: 'Delete multiple files from S3 bucket' })
  @ApiBody({
    description: 'Array of S3 keys to delete',
    schema: {
      type: 'object',
      properties: {
        keys: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of S3 keys to delete',
        },
      },
      required: ['keys'],
    },
  })
  @ApiResponse({ status: 200, description: 'Files deleted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async deleteFiles(@Body('keys') keys: string[]): Promise<{ success: boolean; message: string; results: any[] }> {
    const results = await this.uploadService.deleteFiles(keys);
    
    return {
      success: true,
      message: `${results.length} files deleted successfully`,
      results,
    };
  }

  @Get('metadata/:key')
  @ApiOperation({ summary: 'Get file metadata from S3' })
  @ApiResponse({ status: 200, description: 'File metadata retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async getFileMetadata(@Param('key') key: string): Promise<any> {
    return await this.uploadService.getFileMetadata(key);
  }

  @Get('exists/:key')
  @ApiOperation({ summary: 'Check if file exists in S3' })
  @ApiResponse({ status: 200, description: 'File existence checked successfully' })
  async fileExists(@Param('key') key: string): Promise<{ exists: boolean; key: string }> {
    const exists = await this.uploadService.fileExists(key);
    return { exists, key };
  }

  @Get('presigned-url/:key')
  @ApiOperation({ summary: 'Generate presigned URL for file access' })
  @ApiQuery({ name: 'expiresIn', required: false, description: 'Expiration time in seconds (default: 3600)' })
  @ApiResponse({ status: 200, description: 'Presigned URL generated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async getPresignedUrl(
    @Param('key') key: string,
    @Query('expiresIn') expiresIn?: string,
  ): Promise<{ url: string; key: string; expiresIn: number }> {
    const expires = expiresIn ? parseInt(expiresIn) : 3600;
    const url = await this.uploadService.getPresignedUrl(key, expires);
    
    return {
      url,
      key,
      expiresIn: expires,
    };
  }

  @Get('info')
  @ApiOperation({ summary: 'Get upload service info' })
  @ApiResponse({ status: 200, description: 'Service info retrieved successfully' })
  async getInfo(): Promise<{ bucket: string; environment: string; region: string; endpoint: string }> {
    return {
      bucket: this.uploadService.getBucketName(),
      environment: process.env.NODE_ENV || 'development',
      region: process.env.S3_REGION || 'us-east-1',
      endpoint: process.env.S3_ENDPOINT || 'https://s3.cloudfly.vn',
    };
  }
}
