# Upload Module

Module tải lên file linh hoạt có thể sử dụng trong các module khác.

## Cách sử dụng trong module khác

### 1. Import UploadModule

```typescript
import { Module } from '@nestjs/common';
import { UploadModule } from '../upload/upload.module';
import { YourService } from './your.service';

@Module({
  imports: [UploadModule],
  providers: [YourService],
})
export class YourModule {}
```

### 2. Inject UploadService vào service

```typescript
import { Injectable } from '@nestjs/common';
import { UploadService, UploadOptions } from '../upload/upload.service';

@Injectable()
export class YourService {
  constructor(private readonly uploadService: UploadService) {}

  // Upload ảnh với options tùy chỉnh
  async uploadUserImage(file: Express.Multer.File, userId: string) {
    const options: UploadOptions = {
      folder: `users/${userId}/images`,
      maxSize: 2 * 1024 * 1024, // 2MB
      allowedTypes: ['image/jpeg', 'image/png'],
    };

    return await this.uploadService.uploadFile(file, options);
  }

  // Upload avatar
  async uploadUserAvatar(file: Express.Multer.File, userId: string) {
    return await this.uploadService.uploadAvatar(file, userId);
  }

  // Upload document
  async uploadUserDocument(file: Express.Multer.File, userId: string) {
    const options: UploadOptions = {
      folder: `users/${userId}/documents`,
      fileName: `document-${Date.now()}.pdf`,
    };

    return await this.uploadService.uploadDocument(file, options);
  }

  // Xóa file
  async deleteUserFile(key: string) {
    return await this.uploadService.deleteFile(key);
  }

  // Kiểm tra file tồn tại
  async checkFileExists(key: string) {
    return await this.uploadService.fileExists(key);
  }

  // Lấy metadata file
  async getFileInfo(key: string) {
    return await this.uploadService.getFileMetadata(key);
  }
}
```

### 3. Sử dụng trong controller

```typescript
import { Controller, Post, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { YourService } from './your.service';

@Controller('your')
export class YourController {
  constructor(private readonly yourService: YourService) {}

  @Post('upload-image')
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    return await this.yourService.uploadUserImage(file, 'user123');
  }
}
```

## API Endpoints

### Upload
- `POST /upload/image` - Upload ảnh
- `POST /upload/file` - Upload file bất kỳ
- `POST /upload/document` - Upload document
- `POST /upload/avatar` - Upload avatar

### Delete
- `DELETE /upload/file/:key` - Xóa file
- `DELETE /upload/image/:key` - Xóa ảnh
- `DELETE /upload/files` - Xóa nhiều file

### Utility
- `GET /upload/metadata/:key` - Lấy metadata file
- `GET /upload/exists/:key` - Kiểm tra file tồn tại
- `GET /upload/presigned-url/:key` - Tạo presigned URL
- `GET /upload/info` - Thông tin service

## UploadOptions Interface

```typescript
interface UploadOptions {
  folder?: string;        // Thư mục lưu trữ
  fileName?: string;      // Tên file tùy chỉnh
  acl?: string;          // Quyền truy cập (default: 'public-read')
  contentType?: string;   // Loại file
  maxSize?: number;      // Kích thước tối đa (bytes)
  allowedTypes?: string[]; // Các loại file được phép
}
```

## UploadResult Interface

```typescript
interface UploadResult {
  url: string;           // URL truy cập file
  key: string;           // S3 key
  bucket: string;        // Tên bucket
  size: number;          // Kích thước file
  contentType: string;   // Loại file
}
```

## Ví dụ sử dụng nâng cao

```typescript
// Upload với validation tùy chỉnh
const options: UploadOptions = {
  folder: 'products/images',
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  acl: 'private', // File riêng tư
};

const result = await this.uploadService.uploadFile(file, options);

// Xóa nhiều file cùng lúc
const keys = ['file1.jpg', 'file2.jpg', 'file3.jpg'];
const deleteResults = await this.uploadService.deleteFiles(keys);

// Tạo presigned URL cho file riêng tư
const presignedUrl = await this.uploadService.getPresignedUrl('private/file.jpg', 3600);
```
