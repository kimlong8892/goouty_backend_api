import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DevicesService } from '../devices/devices.service';
import { WebPushService } from './web-push.service';
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
    private devicesService: DevicesService,
    private webPushService: WebPushService,
    @Inject(forwardRef(() => EnhancedNotificationService))
    private enhancedNotificationService: EnhancedNotificationService,
  ) { }

  async sendTripCreatedNotification(tripId: string, tripTitle: string, createdBy: string) {
    try {
      // Lấy tất cả thiết bị có push subscription của tất cả users
      const devicesWithPushSubscription = await this.devicesService.getAllDevicesWithPushSubscription();

      console.log(`Sending trip created notification to ${devicesWithPushSubscription.length} devices`);

      // Gửi thông báo đến tất cả thiết bị
      const notifications = await Promise.all(
        devicesWithPushSubscription.map(async (device) => {
          // Tạo notification object
          const notification = {
            id: `notification_${Date.now()}_${Math.random()}`,
            userId: device.userId,
            type: 'trip_created',
            title: 'Chuyến đi mới được tạo',
            message: `Chuyến đi "${tripTitle}" đã được tạo thành công!`,
            data: {
              tripId,
              tripTitle,
              createdBy,
              timestamp: new Date(),
            },
            createdAt: new Date(),
          };

          // Gửi push notification thực tế
          try {
            if (device.pushSubscription) {
              // TODO: Implement actual push notification sending
              console.log(`Would send push notification to device ${device.id} of user ${device.userId}`);
              // await this.webPushService.sendNotification(device.pushSubscription, JSON.stringify(notification));
            }

            console.log(`Push notification sent to device ${device.id} of user ${device.userId}`);
          } catch (pushError) {
            console.error(`Failed to send push notification to device ${device.id}:`, pushError);
          }

          return notification;
        })
      );

      console.log(`Sent ${notifications.length} trip created notifications`);
      return notifications;
    } catch (error) {
      console.error('Error sending trip created notifications:', error);
      throw error;
    }
  }

  async sendTestNotificationToAllUsers() {
    try {
      // Lấy tất cả thiết bị có push subscription của tất cả users
      const devicesWithPushSubscription = await this.devicesService.getAllDevicesWithPushSubscription();

      console.log(`Sending test notification to ${devicesWithPushSubscription.length} devices`);

      // Gửi thông báo test đến tất cả thiết bị
      const notifications = await Promise.all(
        devicesWithPushSubscription.map(async (device) => {
          // Tạo notification object
          const notification = {
            id: `notification_${Date.now()}_${Math.random()}`,
            userId: device.userId,
            type: 'test',
            title: 'Test thông báo',
            message: 'test 123',
            data: {
              timestamp: new Date(),
            },
            createdAt: new Date(),
          };

          // Gửi push notification thực tế
          try {
            if (device.pushSubscription) {
              // TODO: Implement actual push notification sending
              console.log(`Would send test push notification to device ${device.id} of user ${device.userId}`);
              // await this.webPushService.sendNotification(device.pushSubscription, JSON.stringify(notification));
            }

            console.log(`Test push notification sent to device ${device.id} of user ${device.userId}`);
          } catch (pushError) {
            console.error(`Failed to send test push notification to device ${device.id}:`, pushError);
          }

          return notification;
        })
      );

      console.log(`Sent ${notifications.length} test notifications`);
      return notifications;
    } catch (error) {
      console.error('Error sending test notifications:', error);
      throw error;
    }
  }


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

      const device = await this.devicesService.createOrUpdateDevice(userId, {
        deviceId: deviceData.deviceId,
        deviceName: deviceData.deviceName,
        userAgent: deviceData.userAgent,
        pushSubscription: deviceData.pushSubscription,
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
   * Chỉ cần kiểm tra device_id có tồn tại với user_id hiện tại
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
      const currentDevice = await this.devicesService.getUserDevices(userId);
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

  /**
   * Gửi thông báo test tới tất cả device trong hệ thống qua queue system-notifications
   */
  async sendTestNotificationToAllDevices(userId: string) {
    try {
      console.log(`🔄 Sending test notification to all devices via queue system-notifications (triggered by user ${userId})`);

      // Lấy tất cả users có notifications enabled
      const users = await this.prisma.user.findMany({
        where: { notificationsEnabled: true },
        select: { id: true, email: true, fullName: true }
      });

      if (users.length === 0) {
        return {
          success: false,
          message: 'Không có user nào có notifications enabled trong hệ thống',
          sentCount: 0,
          totalUsers: 0,
        };
      }

      // Sử dụng EnhancedNotificationService để gửi qua queue
      const result = await this.enhancedNotificationService.sendSystemAnnouncement(
        'Đây là thông báo test gửi tới tất cả device trong hệ thống',
        {
          skipEmail: false,
          skipPush: false
        }
      );

      console.log(`📤 Test notification queued for ${users.length} users via system-notifications queue`);

      return {
        success: true,
        message: `Đã đưa thông báo test vào queue system-notifications cho ${users.length} users`,
        queuedUsers: users.length,
        totalUsers: users.length,
        queueResult: result
      };
    } catch (error) {
      console.error('Error queuing test notification:', error);
      throw error;
    }
  }

  // ==================== NOTIFICATION CRUD OPERATIONS ====================

  /**
   * Tạo notification mới cho user
   */
  public async createNotification(userId: string, createNotificationDto: CreateNotificationDto): Promise<NotificationResponseDto> {
    try {
      const notification = await this.prisma.notification.create({
        data: {
          userId,
          title: createNotificationDto.title,
          body: createNotificationDto.body,
          type: createNotificationDto.type || NotificationType.INFO,
          data: createNotificationDto.data,
          sentAt: new Date(),
        },
      });

      console.log(`📝 Created notification ${notification.id} for user ${userId}`);
      return notification as NotificationResponseDto;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Lấy danh sách notifications của user
   */
  public async getUserNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20,
    status?: NotificationStatus,
    type?: NotificationType
  ): Promise<NotificationListResponseDto> {
    try {
      const skip = (page - 1) * limit;

      const where: any = { userId };
      if (status) where.status = status;
      if (type) where.type = type;

      const [notifications, total, unreadCount] = await Promise.all([
        this.prisma.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.notification.count({ where }),
        this.prisma.notification.count({
          where: { userId, status: NotificationStatus.UNREAD }
        }),
      ]);

      const totalPages = Math.ceil(total / limit);

      const listTripId = notifications
        .filter(n => n?.data?.['type'] === 'trip_invitation')
        .map(n => n?.data?.['context']?.['tripId'])
        .filter(Boolean);
      const listTripJoin = await this.prisma.tripMember.findMany({
        where: {
          tripId: {
            in: listTripId,
          },
          userId: userId,
          status: 'accepted',
        },
        include: {
          trip: true,
        }
      });

      notifications.forEach(notification => {
        const trip = listTripJoin.find(trip => trip.trip.id === notification.data?.['context']?.['tripId']);

        if (trip) {
          notification.data['url'] = '/trip/' + trip.trip.id;
        }
      });

      return {
        notifications: notifications as NotificationResponseDto[],
        total,
        page,
        limit,
        totalPages,
        unreadCount,
      };
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  /**
   * Lấy notification theo ID
   */
  public async getNotificationById(notificationId: string, userId: string): Promise<NotificationResponseDto> {
    try {
      const notification = await this.prisma.notification.findFirst({
        where: {
          id: notificationId,
          userId,
        },
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      return notification as NotificationResponseDto;
    } catch (error) {
      console.error('Error getting notification by ID:', error);
      throw error;
    }
  }

  /**
   * Cập nhật notification
   */
  public async updateNotification(
    notificationId: string,
    userId: string,
    updateNotificationDto: UpdateNotificationDto
  ): Promise<NotificationResponseDto> {
    try {
      const updateData: any = { ...updateNotificationDto };

      // Nếu mark as read, set readAt
      if (updateNotificationDto.status === NotificationStatus.READ) {
        updateData.readAt = new Date();
      }

      const notification = await this.prisma.notification.update({
        where: {
          id: notificationId,
          userId,
        },
        data: updateData,
      });

      console.log(`📝 Updated notification ${notificationId} for user ${userId}`);
      return notification as NotificationResponseDto;
    } catch (error) {
      console.error('Error updating notification:', error);
      throw error;
    }
  }

  /**
   * Xóa notification
   */
  public async deleteNotification(notificationId: string, userId: string): Promise<void> {
    try {
      await this.prisma.notification.delete({
        where: {
          id: notificationId,
          userId,
        },
      });

      console.log(`🗑️ Deleted notification ${notificationId} for user ${userId}`);
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Mark notifications as read
   */
  public async markAsRead(userId: string, markAsReadDto: MarkAsReadDto): Promise<{ updated: number }> {
    try {
      const result = await this.prisma.notification.updateMany({
        where: {
          id: { in: markAsReadDto.notificationIds },
          userId,
          status: NotificationStatus.UNREAD,
        },
        data: {
          status: NotificationStatus.READ,
          readAt: new Date(),
        },
      });

      console.log(`✅ Marked ${result.count} notifications as read for user ${userId}`);
      return { updated: result.count };
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  public async markAllAsRead(userId: string): Promise<{ updated: number }> {
    try {
      const result = await this.prisma.notification.updateMany({
        where: {
          userId,
          status: NotificationStatus.UNREAD,
        },
        data: {
          status: NotificationStatus.READ,
          readAt: new Date(),
        },
      });

      console.log(`✅ Marked all ${result.count} notifications as read for user ${userId}`);
      return { updated: result.count };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Lấy thống kê notifications của user
   */
  public async getNotificationStats(userId: string): Promise<NotificationStatsDto> {
    try {
      const [total, unread, read, archived] = await Promise.all([
        this.prisma.notification.count({ where: { userId } }),
        this.prisma.notification.count({ where: { userId, status: NotificationStatus.UNREAD } }),
        this.prisma.notification.count({ where: { userId, status: NotificationStatus.READ } }),
        this.prisma.notification.count({ where: { userId, status: NotificationStatus.ARCHIVED } }),
      ]);

      // Lấy thống kê theo type
      const typeStats = await this.prisma.notification.groupBy({
        by: ['type'],
        where: { userId },
        _count: { type: true },
      });

      const byType = typeStats.reduce((acc, stat) => {
        acc[stat.type as NotificationType] = stat._count.type;
        return acc;
      }, {} as Record<NotificationType, number>);

      return {
        total,
        unread,
        read,
        archived,
        byType,
      };
    } catch (error) {
      console.error('Error getting notification stats:', error);
      throw error;
    }
  }

  /**
   * Xóa tất cả notifications đã đọc
   */
  public async clearReadNotifications(userId: string): Promise<{ deleted: number }> {
    try {
      const result = await this.prisma.notification.deleteMany({
        where: {
          userId,
          status: NotificationStatus.READ,
        },
      });

      console.log(`🗑️ Cleared ${result.count} read notifications for user ${userId}`);
      return { deleted: result.count };
    } catch (error) {
      console.error('Error clearing read notifications:', error);
      throw error;
    }
  }

  // ==================== PUSH NOTIFICATION METHODS ====================

  /**
   * Gửi thông báo và lưu vào database
   */
  async sendNotificationWithDatabase(
    userId: string,
    title: string,
    body: string,
    type: NotificationType = NotificationType.INFO,
    data?: any,
    pushSubscription?: any
  ): Promise<{ notificationId: string; pushSent: boolean }> {
    try {
      // Check if user has notifications enabled
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { notificationsEnabled: true },
      });

      // Tạo notification trong database
      const notification = await this.createNotification(userId, {
        title,
        body,
        type,
        data,
      });

      let pushSent = false;

      // Nếu có pushSubscription và user đã bật thông báo, gửi push notification
      if (pushSubscription && user?.notificationsEnabled) {
        try {
          const pushPayload = {
            title,
            body,
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png',
            tag: `notification-${notification.id}`,
            data: {
              ...data,
              notificationId: notification.id,
              url: data?.url || '/notifications',
            },
          };

          await this.sendPushNotification(pushSubscription, pushPayload);
          pushSent = true;
          console.log(`Push notification sent for notification ${notification.id}`);
        } catch (pushError) {
          console.error(`Failed to send push notification for ${notification.id}:`, pushError);
          // Không throw error vì notification đã được lưu vào database
        }
      } else if (!user?.notificationsEnabled) {
        console.log(`Skipping push notification for user ${userId} - notifications disabled`);
      }

      return {
        notificationId: notification.id,
        pushSent,
      };
    } catch (error) {
      console.error('Error sending notification with database:', error);
      throw error;
    }
  }

  /**
   * Gửi thông báo tới tất cả devices của user và lưu vào database
   */
  async sendNotificationToUserDevices(
    userId: string,
    title: string,
    body: string,
    type: NotificationType = NotificationType.INFO,
    data?: any
  ): Promise<{ notificationId: string; devicesSent: number; totalDevices: number }> {
    try {
      // Check if user has notifications enabled
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { notificationsEnabled: true },
      });

      // Lấy tất cả devices của user có pushSubscription
      const userDevices = await this.prisma.$queryRaw`
        SELECT d.*, u.email as user_email
        FROM "Device" d
        JOIN "User" u ON d."userId" = u.id
        WHERE d."userId" = ${userId} AND d."pushSubscription" IS NOT NULL
      `;

      if ((userDevices as any[]).length === 0) {
        // Nếu không có device nào, chỉ lưu vào database
        const notification = await this.createNotification(userId, {
          title,
          body,
          type,
          data,
        });

        return {
          notificationId: notification.id,
          devicesSent: 0,
          totalDevices: 0,
        };
      }

      // Tạo notification trong database
      const notification = await this.createNotification(userId, {
        title,
        body,
        type,
        data,
      });

      let devicesSent = 0;

      // Gửi push notification tới tất cả devices chỉ khi user đã bật thông báo
      if (user?.notificationsEnabled) {
        for (const device of userDevices as any[]) {
          try {
            const pushSubscription = JSON.parse(device.pushSubscription);

            const pushPayload = {
              title,
              body,
              icon: '/icon-192x192.png',
              badge: '/icon-192x192.png',
              tag: `notification-${notification.id}`,
              data: {
                ...data,
                notificationId: notification.id,
                url: data?.url || '/notifications',
              },
            };

            await this.sendPushNotification(pushSubscription, pushPayload);
            devicesSent++;
            console.log(`Push notification sent to device ${device.deviceId} for notification ${notification.id}`);
          } catch (error) {
            console.error(`Failed to send push notification to device ${device.deviceId}:`, error);
          }
        }
      } else {
        console.log(`Skipping push notification for user ${userId} - notifications disabled`);
      }

      return {
        notificationId: notification.id,
        devicesSent,
        totalDevices: (userDevices as any[]).length,
      };
    } catch (error) {
      console.error('Error sending notification to user devices:', error);
      throw error;
    }
  }

  /**
   * Gửi push notification tới một device cụ thể
   */
  private async sendPushNotification(pushSubscription: any, payload: any) {
    try {
      console.log('Sending push notification:', { pushSubscription, payload });

      // Tạo notification payload theo chuẩn Web Push Protocol
      const notificationPayload = {
        title: payload.title,
        body: payload.body,
        message: payload.body, // WebPushService expects 'message' field
        icon: payload.icon,
        badge: payload.badge,
        tag: payload.tag,
        data: payload.data,
        actions: payload.actions || [],
        requireInteraction: false,
        silent: false,
      };

      // Sử dụng WebPushService để gửi push notification
      await this.webPushService.sendNotification(
        JSON.stringify(pushSubscription),
        JSON.stringify(notificationPayload)
      );

      console.log('Push notification sent successfully to:', pushSubscription.endpoint);
      return { success: true };
    } catch (error) {
      console.error('Error sending push notification:', error);
      throw error;
    }
  }
}
