import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EnhancedNotificationService } from '../../notifications/enhanced-notification.service';

@Processor('payment-notifications', {
  concurrency: parseInt(process.env.MAIL_QUEUE_CONCURRENCY || '1'),
})
@Injectable()
export class PaymentNotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(PaymentNotificationProcessor.name);

  constructor(
    private readonly enhancedNotificationService: EnhancedNotificationService,
  ) {
    super();
  }

  async process(job: Job<any>): Promise<any> {
    this.logger.log(`Processing payment notification job ${job.id} for user ${job.data.userId}`);
    try {
      return await this.enhancedNotificationService.processNotificationJob(job.data);
    } catch (error) {
      this.logger.error(`Payment notification job ${job.id} failed:`, error);
      throw error;
    }
  }
}