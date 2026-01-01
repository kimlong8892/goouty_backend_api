import { ApiProperty } from '@nestjs/swagger';

export class UploadInfoDto {
  @ApiProperty({ description: 'URL of the uploaded avatar' })
  url: string;

  @ApiProperty({ description: 'S3 key of the uploaded avatar' })
  key: string;

  @ApiProperty({ description: 'S3 bucket name' })
  bucket: string;

  @ApiProperty({ description: 'File size in bytes' })
  size: number;

  @ApiProperty({ description: 'File content type' })
  contentType: string;
}

export class UserProfileDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'User email' })
  email: string;

  @ApiProperty({ description: 'User full name', required: false })
  fullName?: string;

  @ApiProperty({ description: 'User phone number', required: false })
  phoneNumber?: string;

  @ApiProperty({ description: 'Profile picture URL', required: false })
  profilePicture?: string;

  @ApiProperty({ description: 'Bank ID', required: false })
  bankId?: string;

  @ApiProperty({ description: 'Bank account number', required: false })
  bankNumber?: string;

  @ApiProperty({ description: 'Last updated timestamp' })
  updatedAt: Date;
}

export class UploadAvatarDataDto {
  @ApiProperty({ description: 'Updated user profile', type: UserProfileDto })
  user: UserProfileDto;

  @ApiProperty({ description: 'Upload information', type: UploadInfoDto })
  upload: UploadInfoDto;
}

export class UploadAvatarResponseDto {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'Upload data', type: UploadAvatarDataDto })
  data: UploadAvatarDataDto;
}

export class DeleteAvatarDataDto {
  @ApiProperty({ description: 'Updated user profile', type: UserProfileDto })
  user: UserProfileDto;
}

export class DeleteAvatarResponseDto {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'Response data', type: DeleteAvatarDataDto })
  data: DeleteAvatarDataDto;
}
