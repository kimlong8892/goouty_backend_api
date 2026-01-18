import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CloudTasksClient } from '@google-cloud/tasks';

export interface EmailTaskPayload {
    to: string;
    subject: string;
    html: string;
    notificationType?: string; // For routing to appropriate queue
}

export interface EmailTaskPayload {
    to: string;
    subject: string;
    html: string;
    notificationType?: string; // Kept for backward compatibility/logging
}

@Injectable()
export class CloudTasksService {
    private readonly logger = new Logger(CloudTasksService.name);
    private client: CloudTasksClient | null = null;
    private projectId: string;
    private location: string;
    private defaultQueue: string;
    private serviceUrl: string;

    constructor(private configService: ConfigService) {
        this.projectId = this.configService.get<string>('GCP_PROJECT_ID') || '';
        this.location = this.configService.get<string>('GCP_LOCATION') || 'asia-southeast1';
        this.serviceUrl = this.configService.get<string>('CLOUD_TASKS_SERVICE_URL') || '';

        // Initialize default queue
        this.defaultQueue = this.configService.get<string>('QUEUE_MAIL') || 'queue-mail-notifications';

        // Only initialize Cloud Tasks if credentials are provided
        const useCloudTasks = this.configService.get<string>('USE_CLOUD_TASKS') === 'true';

        if (useCloudTasks && this.projectId && this.serviceUrl) {
            try {
                this.client = new CloudTasksClient();
                this.logger.log('✅ Cloud Tasks client initialized');
                this.logger.log(`📋 Configured queue: ${this.defaultQueue}`);
            } catch (error) {
                this.logger.warn('⚠️ Failed to initialize Cloud Tasks client, will use direct email sending', error);
            }
        } else {
            this.logger.log('ℹ️ Cloud Tasks disabled, using direct email sending');
        }
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
            // Use the single default queue
            const queueName = this.defaultQueue;
            const parent = this.client.queuePath(this.projectId, this.location, queueName);

            // Create task payload without notificationType (to avoid 400 Bad Request due to strict whitelist validation)
            const { notificationType, ...emailPayload } = payload;

            const task = {
                httpRequest: {
                    httpMethod: 'POST' as const,
                    url: `${this.serviceUrl}/api/internal/send-email`,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: Buffer.from(JSON.stringify(emailPayload)).toString('base64'),
                },
            };

            this.logger.log(`📤 Creating Cloud Task for email to: ${payload.to} (queue: ${queueName})`);

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
