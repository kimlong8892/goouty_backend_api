import { Controller, Post, Body, Logger, HttpCode, Headers, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';

export class SendEmailDto {
    to: string;
    subject: string;
    html: string;
}

@Controller('internal')
export class InternalController {
    private readonly logger = new Logger(InternalController.name);

    constructor(
        private readonly emailService: EmailService,
        private readonly configService: ConfigService
    ) { }

    /**
     * Endpoint for Cloud Tasks to send emails
     * This endpoint should be protected in production (e.g., only allow requests from Cloud Tasks)
     */
    @Post('send-email')
    @HttpCode(200)
    async sendEmail(
        @Body() dto: SendEmailDto,
        @Headers('x-internal-api-key') apiKey: string
    ) {
        const configuredKey = this.configService.get<string>('INTERNAL_API_KEY');

        // Security check
        if (!configuredKey || apiKey !== configuredKey) {
            this.logger.warn(`⛔ [SECURITY] Unauthorized access attempt to internal endpoint from IP. API Key provided: ${apiKey ? 'Yes' : 'No'}`);
            throw new UnauthorizedException('Invalid Internal API Key');
        }

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
