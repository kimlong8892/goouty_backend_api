import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CloudTasksClient } from '@google-cloud/tasks';

export interface EmailTaskPayload {
    to: string;
    subject: string;
    html: string;
    notificationType?: string; // For routing to appropriate queue
}

export enum NotificationQueueType {
    TRIP = 'trip',
    EXPENSE = 'expense',
    PAYMENT = 'payment',
    SYSTEM = 'system',
}

@Injectable()
export class CloudTasksService {
    private readonly logger = new Logger(CloudTasksService.name);
    private client: CloudTasksClient | null = null;
    private projectId: string;
    private location: string;
    private queues: Map<NotificationQueueType, string>;
    private serviceUrl: string;

    constructor(private configService: ConfigService) {
        this.projectId = this.configService.get<string>('GCP_PROJECT_ID') || '';
        this.location = this.configService.get<string>('GCP_LOCATION') || 'asia-southeast1';
        this.serviceUrl = this.configService.get<string>('CLOUD_TASKS_SERVICE_URL') || '';

        // Initialize queue mappings
        this.queues = new Map([
            [NotificationQueueType.TRIP, this.configService.get<string>('QUEUE_TRIP') || 'queue-trip-notifications-dev'],
            [NotificationQueueType.EXPENSE, this.configService.get<string>('QUEUE_EXPENSE') || 'queue-expense-notifications-dev'],
            [NotificationQueueType.PAYMENT, this.configService.get<string>('QUEUE_PAYMENT') || 'queue-payment-notifications-dev'],
            [NotificationQueueType.SYSTEM, this.configService.get<string>('QUEUE_SYSTEM') || 'queue-system-notifications-dev'],
        ]);

        // Only initialize Cloud Tasks if credentials are provided
        const useCloudTasks = this.configService.get<string>('USE_CLOUD_TASKS') === 'true';

        if (useCloudTasks && this.projectId && this.serviceUrl) {
            try {
                this.client = new CloudTasksClient();
                this.logger.log('✅ Cloud Tasks client initialized');
                this.logger.log(`📋 Configured queues:`, Object.fromEntries(this.queues));
            } catch (error) {
                this.logger.warn('⚠️ Failed to initialize Cloud Tasks client, will use direct email sending', error);
            }
        } else {
            this.logger.log('ℹ️ Cloud Tasks disabled, using direct email sending');
        }
    }

    /**
     * Determine queue type based on notification type
     */
    private getQueueType(notificationType?: string): NotificationQueueType {
        if (!notificationType) return NotificationQueueType.SYSTEM;

        const type = notificationType.toLowerCase();

        if (type.includes('trip') || type.includes('invitation')) {
            return NotificationQueueType.TRIP;
        }
        if (type.includes('expense')) {
            return NotificationQueueType.EXPENSE;
        }
        if (type.includes('payment') || type.includes('settlement')) {
            return NotificationQueueType.PAYMENT;
        }

        return NotificationQueueType.SYSTEM;
    }

    /**
     * Create a Cloud Task to send email asynchronously
     */
    async createEmailTask(payload: EmailTaskPayload): Promise<boolean> {
        // If Cloud Tasks is not configured, return false to fallback to direct sending
        if (!this.client || !this.projectId || !this.serviceUrl) {
            this.logger.debug('Cloud Tasks not configured, will use direct email sending');
            return false;
        }

        try {
            // Determine which queue to use
            const queueType = this.getQueueType(payload.notificationType);
            const queueName = this.queues.get(queueType) || this.queues.get(NotificationQueueType.SYSTEM)!;

            const parent = this.client.queuePath(this.projectId, this.location, queueName);

            // Create task payload without notificationType (to avoid 400 Bad Request due to strict whitelist validation)
            const { notificationType, ...emailPayload } = payload;

            const task = {
                httpRequest: {
                    httpMethod: 'POST' as const,
                    url: `${this.serviceUrl}/api/internal/send-email`,
                    headers: {
                        'Content-Type': 'application/json',
                        'x-internal-api-key': this.configService.get<string>('INTERNAL_API_KEY') || '',
                    },
                    body: Buffer.from(JSON.stringify(emailPayload)).toString('base64'),
                },
            };

            this.logger.log(`📤 Creating Cloud Task for email to: ${payload.to} (queue: ${queueName}, type: ${queueType})`);

            const [response] = await this.client.createTask({ parent, task });

            this.logger.log(`✅ Cloud Task created: ${response.name}`);
            return true;
        } catch (error) {
            this.logger.error('❌ Failed to create Cloud Task:', error);
            this.logger.error('Error details:', error.message);
            // Return false to fallback to direct sending
            return false;
        }
    }

    /**
     * Check if Cloud Tasks is enabled and configured
     */
    isEnabled(): boolean {
        return this.client !== null && !!this.projectId && !!this.serviceUrl;
    }
}
