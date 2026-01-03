import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EnhancedNotificationService } from '../../notifications/enhanced-notification.service';

@Processor('system-notifications', {
  concurrency: parseInt(process.env.MAIL_QUEUE_CONCURRENCY || '1'),
})
@Injectable()
export class SystemNotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(SystemNotificationProcessor.name);

  constructor(
    private readonly enhancedNotificationService: EnhancedNotificationService,
  ) {
    super();
  }

  async process(job: Job<any>): Promise<any> {
    this.logger.log(`Processing system notification job ${job.id} for user ${job.data.userId}`);
    try {
      return await this.enhancedNotificationService.processNotificationJob(job.data);
    } catch (error) {
      this.logger.error(`System notification job ${job.id} failed:`, error);
      throw error;
    }
  }
}