import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  HeadBucketCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  HeadObjectCommand,
  GetObjectCommand,
  CopyObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Upload } from '@aws-sdk/lib-storage';
import * as path from 'path';
import * as crypto from 'crypto';

export interface UploadOptions {
  folder?: string;
  fileName?: string;
  acl?: string;
  contentType?: string;
  maxSize?: number; // in bytes
  allowedTypes?: string[];
}

export interface UploadResult {
  url: string;
  key: string;
  bucket: string;
  size: number;
  contentType: string;
}

export interface DeleteResult {
  success: boolean;
  key: string;
}

@Injectable()
export class UploadService {
  private s3Control: S3Client;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    let endpoint = this.configService.get('S3_ENDPOINT', 'https://s3.cloudfly.vn');
    // Remove trailing slash if exists to prevent "invalid hostname" errors
    if (endpoint.endsWith('/')) {
      endpoint = endpoint.slice(0, -1);
    }
    this.bucketName = this.configService.get('S3_BUCKET', 'goouty');
    const region = this.configService.get('S3_REGION', 'us-east-1');
    const forcePathStyle = this.configService.get('S3_FORCE_PATH_STYLE', 'true') === 'true';
    const env = this.configService.get('NODE_ENV', 'development');

    console.log(`[UploadService] Initializing:
      - Endpoint: ${endpoint}
      - Bucket: ${this.bucketName}
      - Region: ${region}
      - ForcePathStyle: ${forcePathStyle}
      - Env: ${env}`);

    this.s3Control = new S3Client({
      region: region,
      endpoint: endpoint,
      forcePathStyle: forcePathStyle,
      credentials: {
        accessKeyId: this.configService.get('S3_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get('S3_SECRET_ACCESS_KEY'),
      },
    });

    // Verify bucket exists
    this.checkBucketExists();
  }

  private async checkBucketExists() {
    try {
      await this.s3Control.send(new HeadBucketCommand({ Bucket: this.bucketName }));
      console.log(`[UploadService] Bucket "${this.bucketName}" is ready.`);
    } catch (error) {
      console.error(`[UploadService] WARNING: Bucket "${this.bucketName}" NOT FOUND or ACCESS DENIED. 
        Please create it in MinIO Console.`);
    }
  }

  /**
   * Upload a file to S3 with flexible options
   * @param file - The file to upload
   * @param options - Upload options for customization
   * @returns Upload result with URL, key, and metadata
   */
  async uploadFile(file: Express.Multer.File, options: UploadOptions = {}): Promise<UploadResult> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    try {
      // Validate file
      this.validateFile(file, options);

      // Generate filename
      const fileName = this.generateFileName(file, options);
      const folder = options.folder || 'uploads';
      const key = `${folder}/${fileName}`;

      // Upload to S3
      console.log(`[UploadService] Uploading to Bucket: ${this.bucketName}, Key: ${key}`);

      const uploadParams: any = {
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: options.contentType || file.mimetype,
      };

      // Only add ACL if specified (some S3-compatible services don't support ACL)
      if (options.acl) {
        uploadParams.ACL = options.acl;
      }

      const upload = new Upload({
        client: this.s3Control,
        params: uploadParams,
      });

      await upload.done();

      // Generate final public URL
      // S3Client doesn't directly return Location, we construct it
      let finalUrl = `${this.configService.get('S3_ENDPOINT')}/${this.bucketName}/${key}`;
      const publicUrl = this.configService.get('S3_PUBLIC_URL');

      if (publicUrl) {
        // Nếu có public URL cấu hình riêng, thay thế endpoint/location gốc
        const baseUrl = publicUrl.endsWith('/') ? publicUrl.slice(0, -1) : publicUrl;
        finalUrl = `${baseUrl}/${this.bucketName}/${key}`;
      } else {
        // Construct standard URL if no public URL is provided
        let endpoint = this.configService.get('S3_ENDPOINT', '');
        if (endpoint.endsWith('/')) endpoint = endpoint.slice(0, -1);
        finalUrl = `${endpoint}/${this.bucketName}/${key}`;
      }

      console.log(`[UploadService] Upload success. Public URL: ${finalUrl}`);

      return {
        url: finalUrl,
        key: key,
        bucket: this.bucketName,
        size: file.size,
        contentType: file.mimetype,
      };
    } catch (error) {
      console.error('Upload error:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Upload failed: ${error.message || 'Unknown S3 error'}`);
    }
  }

  /**
   * Upload an image file (convenience method)
   * @param file - The image file to upload
   * @param options - Upload options
   * @returns Upload result
   */
  async uploadImage(file: Express.Multer.File, options: UploadOptions = {}): Promise<UploadResult> {
    const imageOptions: UploadOptions = {
      folder: 'images',
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      ...options,
    };

    return this.uploadFile(file, imageOptions);
  }

  /**
   * Upload a document file
   * @param file - The document file to upload
   * @param options - Upload options
   * @returns Upload result
   */
  async uploadDocument(file: Express.Multer.File, options: UploadOptions = {}): Promise<UploadResult> {
    const documentOptions: UploadOptions = {
      folder: 'documents',
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      ...options,
    };

    return this.uploadFile(file, documentOptions);
  }

  /**
   * Upload an avatar image
   * @param file - The avatar image file to upload
   * @param userId - User ID for folder organization
   * @returns Upload result
   */
  async uploadAvatar(file: Express.Multer.File, userId?: string): Promise<UploadResult> {
    const avatarOptions: UploadOptions = {
      folder: userId ? `avatars/${userId}` : 'avatars',
      maxSize: 2 * 1024 * 1024, // 2MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
      acl: 'public-read', // Đặt quyền public ngay khi upload
    };

    return this.uploadFile(file, avatarOptions);
  }

  /**
   * Delete a file from S3
   * @param key - The S3 key of the file to delete
   * @returns Delete result
   */
  async deleteFile(key: string): Promise<DeleteResult> {
    try {
      await this.s3Control.send(new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      }));

      return {
        success: true,
        key: key,
      };
    } catch (error) {
      console.error('Delete error:', error);
      throw new BadRequestException('Failed to delete file');
    }
  }

  /**
   * Delete multiple files from S3
   * @param keys - Array of S3 keys to delete
   * @returns Array of delete results
   */
  async deleteFiles(keys: string[]): Promise<DeleteResult[]> {
    if (!keys || keys.length === 0) {
      return [];
    }

    try {
      const deleteObjects = keys.map(key => ({ Key: key }));

      const result = await this.s3Control.send(new DeleteObjectsCommand({
        Bucket: this.bucketName,
        Delete: {
          Objects: deleteObjects,
        },
      }));

      return result.Deleted?.map(deleted => ({
        success: true,
        key: deleted.Key!,
      })) || [];
    } catch (error) {
      console.error('Bulk delete error:', error);
      throw new BadRequestException('Failed to delete files');
    }
  }

  /**
   * Delete an image file (convenience method)
   * @param key - The S3 key of the image to delete
   * @returns Delete result
   */
  async deleteImage(key: string): Promise<DeleteResult> {
    return this.deleteFile(key);
  }

  /**
   * Get file metadata from S3
   * @param key - The S3 key of the file
   * @returns File metadata
   */
  async getFileMetadata(key: string): Promise<any> {
    try {
      const result = await this.s3Control.send(new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      }));

      return {
        key,
        size: result.ContentLength,
        contentType: result.ContentType,
        lastModified: result.LastModified,
        etag: result.ETag,
      };
    } catch (error) {
      console.error('Get metadata error:', error);
      throw new BadRequestException('Failed to get file metadata');
    }
  }

  /**
   * Check if a file exists in S3
   * @param key - The S3 key of the file
   * @returns Boolean indicating if file exists
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      await this.s3Control.send(new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      }));
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate a presigned URL for file access
   * @param key - The S3 key of the file
   * @param expiresIn - Expiration time in seconds (default: 3600)
   * @returns Presigned URL
   */
  async getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      return await getSignedUrl(this.s3Control, command, { expiresIn });
    } catch (error) {
      console.error('Presigned URL error:', error);
      throw new BadRequestException('Failed to generate presigned URL');
    }
  }

  /**
   * Private method to validate file
   */
  private validateFile(file: Express.Multer.File, options: UploadOptions): void {
    // Check file size
    if (options.maxSize && file.size > options.maxSize) {
      throw new BadRequestException(`File size exceeds limit of ${options.maxSize} bytes`);
    }

    // Check file type
    if (options.allowedTypes && !options.allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(`File type ${file.mimetype} is not allowed`);
    }
  }

  /**
   * Private method to generate filename
   */
  private generateFileName(file: Express.Multer.File, options: UploadOptions): string {
    if (options.fileName) {
      return options.fileName;
    }

    const fileExtension = path.extname(file.originalname);
    const timestamp = Date.now();
    const randomId = crypto.randomUUID().substring(0, 8);

    return `${timestamp}-${randomId}${fileExtension}`;
  }

  /**
   * Get bucket name
   */
  getBucketName(): string {
    return this.bucketName;
  }

  /**
   * Copy a file within S3
   * @param sourceKey - The source S3 key
   * @param targetKey - The target S3 key
   * @returns Copy result
   */
  async copyFile(sourceKey: string, targetKey: string): Promise<UploadResult> {
    try {
      console.log(`[UploadService] Copying from ${sourceKey} to ${targetKey}`);

      await this.s3Control.send(new CopyObjectCommand({
        Bucket: this.bucketName,
        CopySource: `${this.bucketName}/${sourceKey}`,
        Key: targetKey,
        ACL: 'public-read', // Ensure copied file is public as well
      }));

      // Construct public URL
      let finalUrl = `${this.configService.get('S3_ENDPOINT')}/${this.bucketName}/${targetKey}`;
      const publicUrl = this.configService.get('S3_PUBLIC_URL');

      if (publicUrl) {
        const baseUrl = publicUrl.endsWith('/') ? publicUrl.slice(0, -1) : publicUrl;
        finalUrl = `${baseUrl}/${this.bucketName}/${targetKey}`;
      } else {
        let endpoint = this.configService.get('S3_ENDPOINT', '');
        if (endpoint.endsWith('/')) endpoint = endpoint.slice(0, -1);
        finalUrl = `${endpoint}/${this.bucketName}/${targetKey}`;
      }

      // Get metadata for the copied object to return complete result
      const metadata = await this.getFileMetadata(targetKey);

      return {
        url: finalUrl,
        key: targetKey,
        bucket: this.bucketName,
        size: metadata.size,
        contentType: metadata.contentType,
      };
    } catch (error) {
      console.error('Copy error:', error);
      throw new BadRequestException(`Failed to copy file: ${error.message}`);
    }
  }

  /**
   * Get S3 instance (for advanced usage)
   */
  getS3Instance(): S3Client {
    return this.s3Control;
  }
}