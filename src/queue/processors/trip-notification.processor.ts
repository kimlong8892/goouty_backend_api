import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { DevicesService } from '../../devices/devices.service';
import { WebPushService } from '../../notifications/web-push.service';
import { EmailService } from '../../email/email.service';
import { NotificationTemplateService } from '../../notifications/notification-template.service';
import { EnhancedNotificationService } from '../../notifications/enhanced-notification.service';

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
    private readonly enhancedNotificationService: EnhancedNotificationService,
  ) {
    super();
  }

  async process(job: Job<any>): Promise<any> {
    this.logger.log(`Processing trip notification job ${job.id} for user ${job.data.userId}`);
    try {
      return await this.enhancedNotificationService.processNotificationJob(job.data);
    } catch (error) {
      this.logger.error(`Trip notification job ${job.id} failed:`, error);
      throw error;
    }
  }
}
