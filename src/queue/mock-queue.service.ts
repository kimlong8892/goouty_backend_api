
import { Injectable, Logger } from '@nestjs/common';
import { NotificationJobData } from './queue.service';

@Injectable()
export class QueueService {
    private readonly logger = new Logger('MockQueueService');

    constructor() {
        this.logger.warn('QueueService is running in MOCK mode (Redis Disabled)');
    }

    async addTripNotificationJob(data: NotificationJobData) {
        this.logger.debug(`[Mock] Adding trip notification job for user ${data.userId}`);
        return Promise.resolve({ id: 'mock-trip-job-id' });
    }

    async addExpenseNotificationJob(data: NotificationJobData) {
        this.logger.debug(`[Mock] Adding expense notification job for user ${data.userId}`);
        return Promise.resolve({ id: 'mock-expense-job-id' });
    }

    async addPaymentNotificationJob(data: NotificationJobData) {
        this.logger.debug(`[Mock] Adding payment notification job for user ${data.userId}`);
        return Promise.resolve({ id: 'mock-payment-job-id' });
    }

    async addSystemNotificationJob(data: NotificationJobData) {
        this.logger.debug(`[Mock] Adding system notification job for user ${data.userId}`);
        return Promise.resolve({ id: 'mock-system-job-id' });
    }

    async addBulkTripNotificationJobs(jobs: NotificationJobData[]) {
        this.logger.debug(`[Mock] Adding ${jobs.length} bulk trip notification jobs`);
        return Promise.resolve([{ id: 'mock-bulk-id' }]);
    }

    async addBulkExpenseNotificationJobs(jobs: NotificationJobData[]) {
        this.logger.debug(`[Mock] Adding ${jobs.length} bulk expense notification jobs`);
        return Promise.resolve([{ id: 'mock-bulk-id' }]);
    }

    async addBulkPaymentNotificationJobs(jobs: NotificationJobData[]) {
        this.logger.debug(`[Mock] Adding ${jobs.length} bulk payment notification jobs`);
        return Promise.resolve([{ id: 'mock-bulk-id' }]);
    }

    async addBulkSystemNotificationJobs(jobs: NotificationJobData[]) {
        this.logger.debug(`[Mock] Adding ${jobs.length} bulk system notification jobs`);
        return Promise.resolve([{ id: 'mock-bulk-id' }]);
    }

    async getQueueStats() {
        return {
            trip: { waiting: 0, active: 0, completed: 0, failed: 0 },
            expense: { waiting: 0, active: 0, completed: 0, failed: 0 },
            payment: { waiting: 0, active: 0, completed: 0, failed: 0 },
            system: { waiting: 0, active: 0, completed: 0, failed: 0 },
        };
    }

    async clearAllQueues() {
        this.logger.debug('[Mock] clearAllQueues called');
    }

    async pauseAllQueues() {
        this.logger.debug('[Mock] pauseAllQueues called');
    }

    async resumeAllQueues() {
        this.logger.debug('[Mock] resumeAllQueues called');
    }
}
