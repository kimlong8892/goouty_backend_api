import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EnhancedNotificationService } from './enhanced-notification.service';
import {
  CreateNotificationDto,
  UpdateNotificationDto,
  NotificationResponseDto,
  NotificationListResponseDto,
  NotificationStatsDto,
  NotificationType,
  NotificationStatus,
  MarkAsReadDto
} from './dto/notification.dto';

@Injectable()
export class NotificationService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => EnhancedNotificationService))
    private enhancedNotificationService: EnhancedNotificationService,
  ) { }

  // All notification sending methods have been removed
  // Only user preferences and device management methods are kept

  async updateUserNotificationPreferences(userId: string, preferences: {
    notificationsEnabled?: boolean;
  }) {
    try {
      const updateData: any = {};

      if (preferences.notificationsEnabled !== undefined) {
        updateData.notificationsEnabled = preferences.notificationsEnabled;
      }

      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          notificationsEnabled: true,
        }
      });

      console.log('Updated user notification preferences:', updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('Error updating user notification preferences:', error);
      throw error;
    }
  }

  async getUserNotificationPreferences(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          notificationsEnabled: true,
        }
      });

      return user;
    } catch (error) {
      console.error('Error getting user notification preferences:', error);
      throw error;
    }
  }

  /**
   * Đăng ký thiết bị với push subscription
   */
  async registerDeviceWithPushSubscription(userId: string, deviceData: {
    deviceId: string;
    deviceName?: string;
    userAgent?: string;
    pushSubscription: string;
  }) {
    try {
      console.log(`Registering device ${deviceData.deviceId} for user ${userId} with push subscription`);

      // Store device info in database
      const device = await this.prisma.device.upsert({
        where: {
          userId_deviceId: {
            userId,
            deviceId: deviceData.deviceId,
          },
        },
        update: {
          deviceName: deviceData.deviceName,
          userAgent: deviceData.userAgent,
          pushSubscription: deviceData.pushSubscription,
          lastSeen: new Date(),
        },
        create: {
          userId,
          deviceId: deviceData.deviceId,
          deviceName: deviceData.deviceName,
          userAgent: deviceData.userAgent,
          pushSubscription: deviceData.pushSubscription,
          lastSeen: new Date(),
        },
      });

      console.log(`Device registered successfully:`, device);
      return device;
    } catch (error) {
      console.error('Error registering device with push subscription:', error);
      throw error;
    }
  }

  /**
   * Kiểm tra xem device hiện tại có trong table Device chưa
   */
  async getCompleteNotificationStatus(userId: string) {
    try {
      console.log(`Checking if current device exists for user ${userId}`);

      // 1. Kiểm tra user notification preferences
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          notificationsEnabled: true,
        }
      });

      if (!user) {
        console.log('User not found');
        return {
          isFullyEnabled: false,
          reason: 'user_not_found',
          userNotificationsEnabled: false,
          hasCurrentDevice: false,
          deviceCount: 0,
        };
      }

      // 2. Kiểm tra device hiện tại có trong table Device chưa
      const currentDevice = await this.prisma.device.findMany({
        where: { userId },
      });
      const hasCurrentDevice = currentDevice.length > 0;

      console.log(`Device check:`, {
        userId,
        userNotificationsEnabled: user.notificationsEnabled,
        deviceCount: currentDevice.length,
        hasCurrentDevice,
      });

      return {
        isFullyEnabled: hasCurrentDevice,
        reason: hasCurrentDevice ? 'device_exists' : 'no_device',
        userNotificationsEnabled: user.notificationsEnabled,
        hasCurrentDevice,
        deviceCount: currentDevice.length,
        devices: currentDevice.map(device => ({
          id: device.id,
          deviceId: device.deviceId,
          deviceName: device.deviceName,
          hasPushSubscription: !!device.pushSubscription,
          lastSeen: device.lastSeen,
        })),
      };
    } catch (error) {
      console.error('Error checking device status:', error);
      throw error;
    }
  }

  // ==================== NOTIFICATION CRUD OPERATIONS ====================
  // Delegate to EnhancedNotificationService

  public async getUserNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20,
    status?: NotificationStatus,
    type?: NotificationType
  ): Promise<NotificationListResponseDto> {
    return this.enhancedNotificationService.getUserNotifications(userId, page, limit, status, type);
  }

  public async getNotificationById(notificationId: string, userId: string): Promise<NotificationResponseDto> {
    return this.enhancedNotificationService.getNotificationById(notificationId, userId);
  }

  public async updateNotification(
    notificationId: string,
    userId: string,
    updateNotificationDto: UpdateNotificationDto
  ): Promise<NotificationResponseDto> {
    return this.enhancedNotificationService.updateNotification(notificationId, userId, updateNotificationDto);
  }

  public async deleteNotification(notificationId: string, userId: string): Promise<void> {
    return this.enhancedNotificationService.deleteNotification(notificationId, userId);
  }

  public async markAsRead(userId: string, markAsReadDto: MarkAsReadDto): Promise<{ updated: number }> {
    return this.enhancedNotificationService.markAsRead(userId, markAsReadDto);
  }

  public async markAllAsRead(userId: string): Promise<{ updated: number }> {
    return this.enhancedNotificationService.markAllAsRead(userId);
  }

  public async getNotificationStats(userId: string): Promise<NotificationStatsDto> {
    return this.enhancedNotificationService.getNotificationStats(userId);
  }

  public async clearReadNotifications(userId: string): Promise<{ deleted: number }> {
    return this.enhancedNotificationService.clearReadNotifications(userId);
  }
}
