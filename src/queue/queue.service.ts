import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { BullMQBoardService } from './bullmq-board.service';

export interface NotificationJobData {
  type: string;
  context: any;
  userId: string;
  options?: {
    skipEmail?: boolean;
    skipPush?: boolean;
    data?: any;
  };
}

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);
  
  // Cấu hình job retention có thể điều chỉnh
  private readonly jobRetentionConfig = {
    removeOnComplete: process.env.BULLMQ_REMOVE_ON_COMPLETE === 'false' ? false : parseInt(process.env.BULLMQ_REMOVE_ON_COMPLETE || '0'),
    removeOnFail: process.env.BULLMQ_REMOVE_ON_FAIL === 'false' ? false : parseInt(process.env.BULLMQ_REMOVE_ON_FAIL || '0'),
  };

  constructor(
    @InjectQueue('trip-notifications') private tripQueue: Queue,
    @InjectQueue('expense-notifications') private expenseQueue: Queue,
    @InjectQueue('payment-notifications') private paymentQueue: Queue,
    @InjectQueue('system-notifications') private systemQueue: Queue,
    private bullMQBoardService: BullMQBoardService,
  ) {
    this.logger.log('QueueService initialized');
    this.logger.log('TripQueue available:', !!this.tripQueue);
    this.logger.log('ExpenseQueue available:', !!this.expenseQueue);
    this.logger.log('PaymentQueue available:', !!this.paymentQueue);
    this.logger.log('SystemQueue available:', !!this.systemQueue);
    
    // Register all queues with BullMQ Board
    this.bullMQBoardService.addQueue(this.tripQueue);
    this.bullMQBoardService.addQueue(this.expenseQueue);
    this.bullMQBoardService.addQueue(this.paymentQueue);
    this.bullMQBoardService.addQueue(this.systemQueue);
    this.logger.log('All queues registered with BullMQ Board');
  }

  // Helper method để tạo job options
  private getJobOptions() {
    return {
      attempts: 3,
      backoff: {
        type: 'exponential' as const,
        delay: 2000,
      },
      removeOnComplete: this.jobRetentionConfig.removeOnComplete,
      removeOnFail: this.jobRetentionConfig.removeOnFail,
    };
  }

  async addTripNotificationJob(data: NotificationJobData) {
    this.logger.log(`Adding trip notification job for user ${data.userId}`);
    return this.tripQueue.add('trip-notification', data, this.getJobOptions());
  }

  async addExpenseNotificationJob(data: NotificationJobData) {
    this.logger.log(`Adding expense notification job for user ${data.userId}`);
    return this.expenseQueue.add('expense-notification', data, this.getJobOptions());
  }

  async addPaymentNotificationJob(data: NotificationJobData) {
    this.logger.log(`Adding payment notification job for user ${data.userId}`);
    return this.paymentQueue.add('payment-notification', data, this.getJobOptions());
  }

  async addSystemNotificationJob(data: NotificationJobData) {
    this.logger.log(`Adding system notification job for user ${data.userId}`);
    return this.systemQueue.add('system-notification', data, this.getJobOptions());
  }

  async addBulkTripNotificationJobs(jobs: NotificationJobData[]) {
    this.logger.log(`Adding ${jobs.length} bulk trip notification jobs`);
    return this.tripQueue.addBulk(
      jobs.map(job => ({
        name: 'trip-notification',
        data: job,
        opts: this.getJobOptions(),
      }))
    );
  }

  async addBulkExpenseNotificationJobs(jobs: NotificationJobData[]) {
    this.logger.log(`Adding ${jobs.length} bulk expense notification jobs`);
    return this.expenseQueue.addBulk(
      jobs.map(job => ({
        name: 'expense-notification',
        data: job,
        opts: this.getJobOptions(),
      }))
    );
  }

  async addBulkPaymentNotificationJobs(jobs: NotificationJobData[]) {
    this.logger.log(`Adding ${jobs.length} bulk payment notification jobs`);
    return this.paymentQueue.addBulk(
      jobs.map(job => ({
        name: 'payment-notification',
        data: job,
        opts: this.getJobOptions(),
      }))
    );
  }

  async addBulkSystemNotificationJobs(jobs: NotificationJobData[]) {
    this.logger.log(`Adding ${jobs.length} bulk system notification jobs`);
    return this.systemQueue.addBulk(
      jobs.map(job => ({
        name: 'system-notification',
        data: job,
        opts: this.getJobOptions(),
      }))
    );
  }

  async getQueueStats() {
    const [tripStats, expenseStats, paymentStats, systemStats] = await Promise.all([
      this.getQueueStatsForQueue(this.tripQueue, 'trip'),
      this.getQueueStatsForQueue(this.expenseQueue, 'expense'),
      this.getQueueStatsForQueue(this.paymentQueue, 'payment'),
      this.getQueueStatsForQueue(this.systemQueue, 'system'),
    ]);

    return {
      trip: tripStats,
      expense: expenseStats,
      payment: paymentStats,
      system: systemStats,
    };
  }

  private async getQueueStatsForQueue(queue: Queue, name: string) {
    try {
      const [waiting, active, completed, failed] = await Promise.all([
        queue.getWaiting(),
        queue.getActive(),
        queue.getCompleted(),
        queue.getFailed(),
      ]);

      return {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
      };
    } catch (error) {
      this.logger.error(`Error getting stats for ${name} queue:`, error);
      return {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
      };
    }
  }

  async clearAllQueues() {
    await Promise.all([
      this.clearQueue(this.tripQueue, 'trip'),
      this.clearQueue(this.expenseQueue, 'expense'),
      this.clearQueue(this.paymentQueue, 'payment'),
      this.clearQueue(this.systemQueue, 'system'),
    ]);
  }

  private async clearQueue(queue: Queue, name: string) {
    try {
      await queue.clean(0, 0, 'completed');
      await queue.clean(0, 0, 'wait');
      await queue.clean(0, 0, 'active');
      await queue.clean(0, 0, 'failed');
      this.logger.log(`${name} queue cleared successfully`);
    } catch (error) {
      this.logger.error(`Error clearing ${name} queue:`, error);
    }
  }

  async pauseAllQueues() {
    await Promise.all([
      this.tripQueue.pause(),
      this.expenseQueue.pause(),
      this.paymentQueue.pause(),
      this.systemQueue.pause(),
    ]);
  }

  async resumeAllQueues() {
    await Promise.all([
      this.tripQueue.resume(),
      this.expenseQueue.resume(),
      this.paymentQueue.resume(),
      this.systemQueue.resume(),
    ]);
  }
}
