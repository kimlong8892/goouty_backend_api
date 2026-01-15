import { Injectable, Inject, forwardRef, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DevicesService } from '../devices/devices.service';
import { WebPushService } from './web-push.service';
import { EmailService } from '../email/email.service';
import { NotificationTemplateService, NotificationContext } from './notification-template.service';
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

export interface SendNotificationOptions {
  userIds?: string[]; // Specific user IDs to notify (if not provided, notify all trip members)
  tripId?: string; // Trip ID to get members from
  skipEmail?: boolean; // Skip email notification
  skipPush?: boolean; // Skip push notification
  data?: any; // Additional data for the notification
}

@Injectable()
export class EnhancedNotificationService {
  private readonly logger = new Logger(EnhancedNotificationService.name);

  constructor(
    private prisma: PrismaService,
    private devicesService: DevicesService,
    private webPushService: WebPushService,
    private emailService: EmailService,
    private templateService: NotificationTemplateService,
  ) { }

  /**
   * Send notification for trip creation
   */
  async sendTripCreatedNotification(
    tripId: string,
    tripTitle: string,
    createdBy: string,
    options: SendNotificationOptions = {}
  ) {
    this.logger.log('📤 EnhancedNotificationService: sendTripCreatedNotification called');
    this.logger.log('Trip ID:', tripId, 'Title:', tripTitle, 'Created by:', createdBy);

    const context: NotificationContext = {
      tripId,
      tripTitle,
      actionBy: createdBy,
      createdAt: new Date().toLocaleString('vi-VN')
    };

    console.log('Context:', context);

    try {
      const result = await this.sendNotificationToTripMembersDirectly(
        'trip_created',
        context,
        tripId,
        options
      );
      this.logger.log('📤 Direct result:', result);
      return result;
    } catch (error) {
      this.logger.error('❌ Error in sendTripCreatedNotification:', error);
      throw error;
    }
  }

  /**
   * Send notification for trip update
   */
  async sendTripUpdatedNotification(
    tripId: string,
    tripTitle: string,
    updatedBy: string,
    options: SendNotificationOptions = {}
  ) {
    const context: NotificationContext = {
      tripId,
      tripTitle,
      actionBy: updatedBy,
      updatedAt: new Date().toLocaleString('vi-VN')
    };

    return this.sendNotificationToTripMembersDirectly(
      'trip_updated',
      context,
      tripId,
      options
    );
  }

  /**
   * Send notification for trip deletion
   */
  async sendTripDeletedNotification(
    tripId: string,
    tripTitle: string,
    deletedBy: string,
    options: SendNotificationOptions = {}
  ) {
    const context: NotificationContext = {
      tripId,
      tripTitle,
      actionBy: deletedBy,
      deletedAt: new Date().toLocaleString('vi-VN')
    };

    return this.sendNotificationToTripMembersDirectly(
      'trip_deleted',
      context,
      tripId,
      options
    );
  }

  /**
   * Send notification for expense creation
   */
  async sendExpenseAddedNotification(
    tripId: string,
    tripTitle: string,
    expenseTitle: string,
    expenseAmount: number,
    addedBy: string,
    options: SendNotificationOptions = {}
  ) {
    const context: NotificationContext = {
      tripId,
      tripTitle,
      expenseTitle,
      expenseAmount,
      actionBy: addedBy,
      createdAt: new Date().toLocaleString('vi-VN')
    };

    return this.sendNotificationToTripMembersDirectly(
      'expense_added',
      context,
      tripId,
      options
    );
  }

  /**
   * Send notification for expense update
   */
  async sendExpenseUpdatedNotification(
    tripId: string,
    tripTitle: string,
    expenseTitle: string,
    updatedBy: string,
    options: SendNotificationOptions = {}
  ) {
    const context: NotificationContext = {
      tripId,
      tripTitle,
      expenseTitle,
      actionBy: updatedBy,
      updatedAt: new Date().toLocaleString('vi-VN')
    };

    return this.sendNotificationToTripMembersDirectly(
      'expense_updated',
      context,
      tripId,
      options
    );
  }

  /**
   * Send notification for payment creation
   */
  async sendPaymentCreatedNotification(
    tripId: string,
    tripTitle: string,
    debtorName: string,
    creditorName: string,
    paymentAmount: number,
    paidBy: string,
    options: SendNotificationOptions = {}
  ) {
    const context: NotificationContext = {
      tripId,
      tripTitle,
      debtorName,
      creditorName,
      paymentAmount,
      actionBy: paidBy,
      createdAt: new Date().toLocaleString('vi-VN')
    };

    return this.sendNotificationToTripMembersDirectly(
      'payment_created',
      context,
      tripId,
      options
    );
  }

  /**
   * Send trip invitation notification
   */
  async sendTripInvitationNotification(
    tripId: string,
    tripTitle: string,
    invitedUserId: string,
    inviterName?: string,
    options: SendNotificationOptions = {}
  ) {
    const context: NotificationContext = {
      tripId,
      tripTitle,
      inviterName,
      actionBy: invitedUserId,
      createdAt: new Date().toLocaleString('vi-VN'),
      ...(options.data || {})
    };

    return this.sendNotificationToUsersDirectly(
      'trip_invitation',
      context,
      [invitedUserId],
      options
    );
  }

  /**
   * Send system announcement
   */
  async sendSystemAnnouncement(
    message: string,
    options: SendNotificationOptions = {}
  ) {
    const context: NotificationContext = {
      message,
      createdAt: new Date().toLocaleString('vi-VN')
    };

    // Get all users for system announcement
    const users = await this.prisma.user.findMany({
      where: { notificationsEnabled: true },
      select: { id: true, email: true, fullName: true }
    });

    return this.sendNotificationToUsersDirectly(
      'system_announcement',
      context,
      users.map(u => u.id),
      options
    );
  }

  /**
   * Send custom notification
   */
  async sendCustomNotification(
    type: string,
    context: NotificationContext,
    userIds: string[],
    options: SendNotificationOptions = {}
  ) {
    return this.sendNotificationToUsersDirectly(type, context, userIds, options);
  }

  /**
   * Core method to send notifications to trip members
   */
  private async sendNotificationToTripMembersDirectly(
    type: string,
    context: NotificationContext,
    tripId: string,
    options: SendNotificationOptions = {}
  ) {
    try {
      this.logger.log('🔄 sendNotificationToTripMembersDirectly called');

      // Get trip members
      const tripMembers = await this.prisma.tripMember.findMany({
        where: {
          tripId,
          status: 'accepted'
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              notificationsEnabled: true
            }
          }
        }
      });

      // Also include trip owner
      const trip = await this.prisma.trip.findUnique({
        where: { id: tripId },
        select: {
          userId: true,
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              notificationsEnabled: true
            }
          }
        }
      });

      const allUserIds = [
        ...tripMembers.map(m => m.user.id),
        ...(trip ? [trip.userId] : [])
      ].filter((id, index, arr) => arr.indexOf(id) === index); // Remove duplicates

      // Filter out the creator if needed
      const userIds = options.userIds
        ? allUserIds.filter(id => options.userIds!.includes(id))
        : allUserIds.filter(id => id !== context.actionBy);

      if (userIds.length === 0) {
        this.logger.log(`No users to notify for trip ${tripId}`);
        return { success: false, message: 'No users to notify' };
      }

      return this.sendNotificationToUsersDirectly(type, context, userIds, options);
    } catch (error) {
      this.logger.error('Error sending notification to trip members:', error);
      throw error;
    }
  }

  /**
   * Core method to send notifications to specific users
   */
  private async sendNotificationToUsersDirectly(
    type: string,
    context: NotificationContext,
    userIds: string[],
    options: SendNotificationOptions = {}
  ) {
    try {
      const template = await this.templateService.getTemplate(type, context);
      const results = [];

      for (const userId of userIds) {
        try {
          // Get user info
          const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
              id: true,
              email: true,
              fullName: true,
              notificationsEnabled: true
            }
          });

          if (!user || !user.notificationsEnabled) {
            continue;
          }

          // Add user info and options data to context
          const userContext = {
            ...context,
            ...(options.data || {}),
            userName: user.fullName || user.email,
            userEmail: user.email
          };

          const result = await this.sendNotificationToUser(
            userId,
            type,
            userContext,
            template,
            options
          );

          results.push(result);
        } catch (error) {
          this.logger.error(`Error sending notification to user ${userId}:`, error);
        }
      }

      return {
        success: true,
        sentCount: results.length,
        totalUsers: userIds.length,
        results
      };
    } catch (error) {
      this.logger.error('Error sending notifications to users:', error);
      throw error;
    }
  }

  /**
   * Map string type to NotificationType enum
   */
  private mapTypeToEnum(type: string): NotificationType {
    const typeMap = {
      'trip_created': NotificationType.TRIP_CREATED,
      'trip_updated': NotificationType.TRIP_UPDATED,
      'trip_deleted': NotificationType.TRIP_DELETED,
      'expense_added': NotificationType.EXPENSE_ADDED,
      'expense_updated': NotificationType.EXPENSE_UPDATED,
      'payment_created': NotificationType.SETTLEMENT_CREATED,
      'system_announcement': NotificationType.SYSTEM_ANNOUNCEMENT,
      'info': NotificationType.INFO,
      'success': NotificationType.SUCCESS,
      'warning': NotificationType.WARNING,
      'error': NotificationType.ERROR
    };

    return typeMap[type] || NotificationType.INFO;
  }

  // ==================== NOTIFICATION CRUD METHODS ====================

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

      this.logger.log(`📝 Created notification ${notification.id} for user ${userId}`);
      return notification as NotificationResponseDto;
    } catch (error) {
      this.logger.error('Error creating notification:', error);
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

  /**
   * Send notification to a single user
   */
  public async sendNotificationToUser(
    userId: string,
    type: string,
    context: NotificationContext,
    template: any,
    options: SendNotificationOptions = {}
  ) {
    try {
      let notification = null;

      // Determine URL based on notification type
      let notificationUrl = `/trip/${context.tripId}` || '/';
      if (type === 'trip_invitation' && context.acceptUrl) {
        notificationUrl = context.acceptUrl;
      }

      // Create notification in database ONLY if userId exists
      if (userId) {
        notification = await this.createNotification(userId, {
          title: template.title,
          body: template.message,
          type: this.mapTypeToEnum(type),
          data: {
            ...options.data,
            type,
            context,
            url: notificationUrl
          }
        });
      }

      const result = {
        userId,
        notificationId: notification?.id || null,
        pushSent: false,
        emailSent: false
      };

      // Send push notification ONLY if userId exists
      if (!options.skipPush && userId) {
        try {
          const userDevices = await this.devicesService.getUserDevicesWithPushSubscription(userId);

          for (const device of userDevices) {
            if (device.pushSubscription) {
              const pushPayload = {
                title: template.title,
                body: template.message,
                icon: '/icon-192x192.png',
                badge: '/icon-192x192.png',
                tag: `notification-${notification?.id || 'system'}`,
                data: {
                  ...options.data,
                  notificationId: notification?.id || null,
                  type,
                  url: notificationUrl
                }
              };

              await this.webPushService.sendNotification(
                device.pushSubscription,
                JSON.stringify(pushPayload)
              );
              result.pushSent = true;
            }
          }
        } catch (pushError) {
          this.logger.error(`Failed to send push notification to user ${userId}:`, pushError);
        }
      }

      // Send email notification
      if (!options.skipEmail) {
        try {
          let recipientEmail = context.userEmail;

          if (userId) {
            const user = await this.prisma.user.findUnique({
              where: { id: userId },
              select: { email: true, fullName: true }
            });
            if (user) {
              recipientEmail = user.email;
            }
          }

          if (recipientEmail) {
            const rawBody = template.emailBody || template.emailTemplate;
            const emailHtml = rawBody
              ? this.templateService.replacePlaceholders(rawBody, context)
              : await this.templateService.getEmailTemplate(type, context);

            await this.emailService.sendEmail({
              to: recipientEmail,
              subject: template.emailSubject || template.title,
              html: emailHtml
            });
            result.emailSent = true;
          }
        } catch (emailError) {
          this.logger.error(`Failed to send email notification:`, emailError);
        }
      }

      return result;
    } catch (error) {
      this.logger.error(`Error sending notification:`, error);
      throw error;
    }
  }
}
