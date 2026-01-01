import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { DevicesService } from '../../devices/devices.service';
import { WebPushService } from '../../notifications/web-push.service';
import { EmailService } from '../../email/email.service';
import { NotificationTemplateService } from '../../notifications/notification-template.service';

@Processor('trip-notifications', {
  concurrency: parseInt(process.env.MAIL_QUEUE_CONCURRENCY || '1'),
})
@Injectable()
export class TripNotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(TripNotificationProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly devicesService: DevicesService,
    private readonly webPushService: WebPushService,
    private readonly emailService: EmailService,
    private readonly templateService: NotificationTemplateService,
  ) {
    super();
  }

  async process(job: Job<any>): Promise<any> {
    const { type, context, userId, options } = job.data;

    this.logger.log(`Processing trip notification job ${job.id} for user ${userId}`);

    try {
      // Get user info
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        this.logger.warn(`User ${userId} not found, skipping notification`);
        return { success: false, message: 'User not found' };
      }

      // Get template
      const template = this.templateService.getTemplate(type, context);
      if (!template) {
        this.logger.warn(`Template for type ${type} not found`);
        return { success: false, message: 'Template not found' };
      }

      // Map notification type to Prisma enum
      const mapNotificationType = (type: string) => {
        const typeMap: { [key: string]: string } = {
          'expense_added': 'EXPENSE_ADDED',
          'expense_updated': 'EXPENSE_UPDATED',
          'trip_created': 'TRIP_CREATED',
          'trip_updated': 'TRIP_UPDATED',
          'trip_deleted': 'TRIP_DELETED',
          'payment_created': 'SETTLEMENT_CREATED',
          'system_announcement': 'SYSTEM_ANNOUNCEMENT',
        };
        return typeMap[type] || 'INFO';
      };

      // Create notification record
      const notification = await this.prisma.notification.create({
        data: {
          userId,
          type: mapNotificationType(type) as any,
          title: template.title,
          body: template.message,
          data: context,
        },
      });

      this.logger.log(`Created notification record ${notification.id}`);

      // Send push notification if not skipped and user has notifications enabled
      if (!options?.skipPush && user.notificationsEnabled) {
        try {
          const devices = await this.devicesService.getUserDevices(userId);
          for (const device of devices) {
            const payload = JSON.stringify({
              title: template.title,
              message: template.message,
              data: {
                url: `/trip/${context.tripId}`,
                notificationId: notification.id,
              }
            });
            await this.webPushService.sendNotification(device.pushSubscription, payload);
          }
          this.logger.log(`Sent push notification to ${devices.length} devices`);
        } catch (error) {
          this.logger.error('Error sending push notification:', error);
        }
      } else if (!user.notificationsEnabled) {
        this.logger.log(`Skipping push notification for user ${userId} - notifications disabled`);
      }

      // Send email if not skipped
      if (!options?.skipEmail) {
        try {
          const htmlContent = `
            <h2>${template.title}</h2>
            <p>${template.message}</p>
            <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/trip/${context.tripId}">Xem chi tiết</a></p>
          `;
          await this.emailService.sendEmail({
            to: user.email,
            subject: template.emailSubject || template.title,
            html: htmlContent,
          });
          this.logger.log(`Sent email notification to ${user.email}`);
        } catch (error) {
          this.logger.error('Error sending email notification:', error);
        }
      }

      this.logger.log(`Trip notification job ${job.id} completed successfully`);
      return {
        success: true,
        notificationId: notification.id,
        message: 'Notification sent successfully'
      };
    } catch (error) {
      this.logger.error(`Trip notification job ${job.id} failed:`, error);
      throw error;
    }
  }
}
