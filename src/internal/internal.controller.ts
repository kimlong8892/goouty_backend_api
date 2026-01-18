import { Controller, Post, Body, Logger, HttpCode } from '@nestjs/common';
import { EmailService } from '../email/email.service';

export class SendEmailDto {
    to: string;
    subject: string;
    html: string;
}

@Controller('internal')
export class InternalController {
    private readonly logger = new Logger(InternalController.name);

    constructor(private readonly emailService: EmailService) { }

    /**
     * Endpoint for Cloud Tasks to send emails
     * This endpoint should be protected in production (e.g., only allow requests from Cloud Tasks)
     */
    @Post('send-email')
    @HttpCode(200)
    async sendEmail(@Body() dto: SendEmailDto) {
        try {
            this.logger.log(`📧 [CLOUD_TASK] Processing email task for: ${dto.to}`);

            await this.emailService.sendEmail({
                to: dto.to,
                subject: dto.subject,
                html: dto.html,
            });

            this.logger.log(`✅ [CLOUD_TASK] Email sent successfully to: ${dto.to}`);

            return { success: true, message: 'Email sent successfully' };
        } catch (error) {
            this.logger.error(`❌ [CLOUD_TASK] Failed to send email to ${dto.to}:`, error);
            throw error;
        }
    }
}
