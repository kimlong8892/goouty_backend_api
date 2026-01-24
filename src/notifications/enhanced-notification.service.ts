import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { NotificationTemplateService } from './notification-template.service';
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
export class EnhancedNotificationService {
  private readonly logger = new Logger(EnhancedNotificationService.name);

  constructor(
    private prisma: PrismaService,
    private templateService: NotificationTemplateService,
    private configService: ConfigService,
  ) { }

  // All notification methods have been removed
  // TODO: Implement Kafka producer for all notification events
  // The Kafka consumer will handle:
  // 1. Storing notifications in database
  // 2. Sending push notifications
  // 3. Sending emails

  // ==================== NOTIFICATION CRUD METHODS ====================
  // Kept for reading notifications from database

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

      return {
        notifications: notifications as NotificationResponseDto[],
        total,
        page,
        limit,
        totalPages,
        unreadCount,
      };
    } catch (error) {
      this.logger.error('Error getting user notifications:', error);
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
      this.logger.error('Error getting notification by ID:', error);
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

      this.logger.log(`📝 Updated notification ${notificationId} for user ${userId}`);
      return notification as NotificationResponseDto;
    } catch (error) {
      this.logger.error('Error updating notification:', error);
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

      this.logger.log(`🗑️ Deleted notification ${notificationId} for user ${userId}`);
    } catch (error) {
      this.logger.error('Error deleting notification:', error);
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

      this.logger.log(`✅ Marked ${result.count} notifications as read for user ${userId}`);
      return { updated: result.count };
    } catch (error) {
      this.logger.error('Error marking notifications as read:', error);
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

      this.logger.log(`✅ Marked all ${result.count} notifications as read for user ${userId}`);
      return { updated: result.count };
    } catch (error) {
      this.logger.error('Error marking all notifications as read:', error);
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
      this.logger.error('Error getting notification stats:', error);
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

      this.logger.log(`🗑️ Cleared ${result.count} read notifications for user ${userId}`);
      return { deleted: result.count };
    } catch (error) {
      this.logger.error('Error clearing read notifications:', error);
      throw error;
    }
  }
}
