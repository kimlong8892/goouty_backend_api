import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private uploadService: UploadService,
  ) { }

  /**
   * Đếm số chuyến đi của user (chuyến đi sở hữu + chuyến đi là thành viên với status accepted)
   */
  async getTripsCount(userId: string): Promise<number> {
    // Đếm chuyến đi sở hữu
    const ownedTripsCount = await this.prisma.trip.count({
      where: { userId },
    });

    // Đếm chuyến đi là thành viên (status accepted)
    const memberTripsCount = await this.prisma.tripMember.count({
      where: {
        userId,
        status: 'accepted',
        trip: {
          userId: { not: userId }, // Exclude owned trips
        },
      },
    });

    return ownedTripsCount + memberTripsCount;
  }

  /**
   * Đếm số địa điểm (provinces) duy nhất mà user đã đến
   */
  async getPlacesCount(userId: string): Promise<number> {
    // Lấy tất cả trips của user (owned + member với status accepted)
    const ownedTrips = await this.prisma.trip.findMany({
      where: { userId },
      select: { provinceId: true },
    });

    const memberTrips = await this.prisma.trip.findMany({
      where: {
        members: {
          some: {
            userId,
            status: 'accepted',
          },
        },
        userId: { not: userId },
      },
      select: { provinceId: true },
    });

    // Kết hợp và lấy danh sách provinceId duy nhất (loại bỏ null)
    const allProvinceIds = [
      ...ownedTrips.map((t) => t.provinceId),
      ...memberTrips.map((t) => t.provinceId),
    ].filter((id): id is string => id !== null);

    // Đếm số province duy nhất
    const uniqueProvinceIds = new Set(allProvinceIds);
    return uniqueProvinceIds.size;
  }

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
        password: true, // Temporarily select to check if exists
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Lấy số lượng trips và places
    const [tripsCount, placesCount] = await Promise.all([
      this.getTripsCount(userId),
      this.getPlacesCount(userId),
    ]);

    // Return profile with hasPassword flag, but don't expose the actual password
    const { password, ...profileData } = user;
    return {
      ...profileData,
      hasPassword: !!password, // Convert to boolean
      tripsCount,
      placesCount,
    };
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

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const { currentPassword, newPassword, confirmPassword } = changePasswordDto;

    // Validate new password and confirmation match
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Mật khẩu mới và xác nhận mật khẩu không khớp');
    }

    // Validate new password length
    if (newPassword.length < 6) {
      throw new BadRequestException('Mật khẩu mới phải có ít nhất 6 ký tự');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    // Case 1: User has no password (registered via Google/Social login)
    if (!user.password) {
      // Allow them to set a password without providing current password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
        },
      });

      return {
        success: true,
        message: 'Đặt mật khẩu thành công. Bạn có thể sử dụng mật khẩu này để đăng nhập.',
        isNewPassword: true,
      };
    }

    // Case 2: User has existing password - must provide current password
    if (!currentPassword) {
      throw new BadRequestException('Vui lòng nhập mật khẩu hiện tại để đổi mật khẩu');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Mật khẩu hiện tại không chính xác. Vui lòng kiểm tra lại.');
    }

    // Check if new password is same as current password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      throw new BadRequestException('Mật khẩu mới không được trùng với mật khẩu hiện tại');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
    });

    return {
      success: true,
      message: 'Đổi mật khẩu thành công',
      isNewPassword: false,
    };
  }
}
