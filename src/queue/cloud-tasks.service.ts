import { Injectable, Logger } from '@nestjs/common';
import { CloudTasksClient } from '@google-cloud/tasks';
import { ConfigService } from '@nestjs/config';
import { NotificationJobData } from './queue.service';

@Injectable()
export class CloudTasksService {
    private client: CloudTasksClient;
    private readonly logger = new Logger(CloudTasksService.name);
    private readonly projectId: string;
    private readonly location: string;
    private readonly baseUrl: string;
    private readonly serviceAccountEmail: string;

    constructor(private configService: ConfigService) {
        this.client = new CloudTasksClient();
        this.projectId = this.configService.get<string>('GCP_PROJECT_ID');
        this.location = this.configService.get<string>('GCP_LOCATION', 'asia-southeast1');

        let baseUrl = this.configService.get<string>('APP_URL');
        if (baseUrl && baseUrl.endsWith('/')) {
            baseUrl = baseUrl.slice(0, -1);
        }
        this.baseUrl = baseUrl;

        this.serviceAccountEmail = this.configService.get<string>('GCP_SERVICE_ACCOUNT_EMAIL');

        if (!this.projectId) {
            this.logger.error('GCP_PROJECT_ID is not defined in environment variables');
        }

        this.logger.log(`CloudTasksService initialized with Project: ${this.projectId}, Location: ${this.location}`);
        this.logger.log(`CloudTasks Service Account: ${this.serviceAccountEmail}`);
        this.logger.log(`CloudTasks target URL: ${this.baseUrl}/api/queue/process`);
    }

    async addTripNotificationJob(data: NotificationJobData) {
        const queue = this.configService.get<string>('QUEUE_TRIP', 'trip-notifications');
        return this.createTask(queue, data);
    }

    async addExpenseNotificationJob(data: NotificationJobData) {
        const queue = this.configService.get<string>('QUEUE_EXPENSE', 'expense-notifications');
        return this.createTask(queue, data);
    }

    async addPaymentNotificationJob(data: NotificationJobData) {
        const queue = this.configService.get<string>('QUEUE_PAYMENT', 'payment-notifications');
        return this.createTask(queue, data);
    }

    async addSystemNotificationJob(data: NotificationJobData) {
        const queue = this.configService.get<string>('QUEUE_SYSTEM', 'system-notifications');
        return this.createTask(queue, data);
    }

    async addBulkTripNotificationJobs(jobs: NotificationJobData[]) {
        this.logger.debug(`Adding ${jobs.length} bulk trip notification jobs to Cloud Tasks`);
        const results = await Promise.all(jobs.map(job => this.addTripNotificationJob(job)));
        return results;
    }

    async addBulkExpenseNotificationJobs(jobs: NotificationJobData[]) {
        this.logger.debug(`Adding ${jobs.length} bulk expense notification jobs to Cloud Tasks`);
        const results = await Promise.all(jobs.map(job => this.addExpenseNotificationJob(job)));
        return results;
    }

    async addBulkPaymentNotificationJobs(jobs: NotificationJobData[]) {
        this.logger.debug(`Adding ${jobs.length} bulk payment notification jobs to Cloud Tasks`);
        const results = await Promise.all(jobs.map(job => this.addPaymentNotificationJob(job)));
        return results;
    }

    async addBulkSystemNotificationJobs(jobs: NotificationJobData[]) {
        this.logger.debug(`Adding ${jobs.length} bulk system notification jobs to Cloud Tasks`);
        const results = await Promise.all(jobs.map(job => this.addSystemNotificationJob(job)));
        return results;
    }

    // Implementation of other required methods for QueueService compatibility
    async getQueueStats() {
        return {
            trip: { waiting: 0, active: 0, completed: 0, failed: 0 },
            expense: { waiting: 0, active: 0, completed: 0, failed: 0 },
            payment: { waiting: 0, active: 0, completed: 0, failed: 0 },
            system: { waiting: 0, active: 0, completed: 0, failed: 0 },
        };
    }

    async clearAllQueues() {
        this.logger.warn('clearAllQueues is not implemented for Cloud Tasks via API in this way');
    }

    async pauseAllQueues() {
        this.logger.warn('pauseAllQueues is not implemented for Cloud Tasks via API in this way');
    }

    async resumeAllQueues() {
        this.logger.warn('resumeAllQueues is not implemented for Cloud Tasks via API in this way');
    }

    private async createTask(queue: string, data: NotificationJobData) {
        if (!this.projectId) {
            this.logger.error('Cannot create task: GCP_PROJECT_ID is missing');
            return { id: 'error-missing-project-id' };
        }

        const parent = this.client.queuePath(this.projectId, this.location, queue);

        // Webhook endpoint to process the task
        // Note: Global prefix 'api' is set in main.ts
        const url = `${this.baseUrl}/api/queue/process`;

        const task: any = {
            httpRequest: {
                httpMethod: 'POST',
                url,
                body: Buffer.from(JSON.stringify(data)).toString('base64'),
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        };

        if (this.serviceAccountEmail) {
            this.logger.log(`Adding OIDC token for service account: ${this.serviceAccountEmail}`);
            task.httpRequest.oidcToken = {
                serviceAccountEmail: this.serviceAccountEmail,
            };
        } else {
            this.logger.warn('GCP_SERVICE_ACCOUNT_EMAIL is empty. Task will be created without OIDC token!');
        }

        this.logger.log(`Creating task for URL: ${url}`);

        try {
            const [response] = await this.client.createTask({ parent, task });
            this.logger.log(`Task created successfully: ${response.name}`);
            return { id: response.name };
        } catch (error) {
            this.logger.error(`Error creating Cloud Task in queue ${queue}: ${error.message}`, error.stack);
            throw error;
        }
    }
}
