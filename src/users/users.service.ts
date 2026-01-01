import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private uploadService: UploadService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phoneNumber: true,
        profilePicture: true,
        bankId: true,
        bankNumber: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: updateProfileDto,
      select: {
        id: true,
        email: true,
        fullName: true,
        phoneNumber: true,
        profilePicture: true,
        bankId: true,
        bankNumber: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Upload avatar for user
   * @param userId - User ID
   * @param file - Avatar image file
   * @returns Updated user profile with new avatar URL
   */
  async uploadAvatar(userId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    try {
      // Upload avatar using UploadService
      const uploadResult = await this.uploadService.uploadAvatar(file, userId);

      // Update user profile with new avatar URL
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          profilePicture: uploadResult.url,
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          phoneNumber: true,
          profilePicture: true,
          bankId: true,
          bankNumber: true,
          updatedAt: true,
        },
      });

      return {
        success: true,
        message: 'Avatar uploaded successfully',
        data: {
          user: updatedUser,
          upload: {
            url: uploadResult.url,
            key: uploadResult.key,
            bucket: uploadResult.bucket,
            size: uploadResult.size,
            contentType: uploadResult.contentType,
          },
        },
      };
    } catch (error) {
      console.error('Avatar upload error:', error);
      throw new BadRequestException('Failed to upload avatar');
    }
  }

  /**
   * Delete user avatar
   * @param userId - User ID
   * @returns Updated user profile without avatar
   */
  async deleteAvatar(userId: string) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // If user has an avatar, try to delete it from S3
    if (user.profilePicture) {
      try {
        // Extract S3 key from URL (assuming URL format: https://bucket.endpoint/key)
        const url = new URL(user.profilePicture);
        const key = url.pathname.substring(1); // Remove leading slash

        // Delete from S3
        await this.uploadService.deleteFile(key);
      } catch (error) {
        console.error('Error deleting avatar from S3:', error);
        // Continue with database update even if S3 deletion fails
      }
    }

    // Update user profile to remove avatar URL
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        profilePicture: null,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phoneNumber: true,
        profilePicture: true,
        bankId: true,
        bankNumber: true,
        updatedAt: true,
      },
    });

    return {
      success: true,
      message: 'Avatar deleted successfully',
      data: {
        user: updatedUser,
      },
    };
  }
}
