import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { CloudTasksService } from '../cloud-tasks/cloud-tasks.service';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private configService: ConfigService,
    @Optional() @Inject(CloudTasksService) private cloudTasksService?: CloudTasksService
  ) { }

  /**
   * Send email with custom template (HTML)
   * Will use Cloud Tasks if enabled, otherwise sends directly via SMTP
   */
  async sendEmail(params: {
    to: string;
    subject: string;
    html: string;
    notificationType?: string;
  }): Promise<void> {
    try {
      // Try to use Cloud Tasks if available and enabled
      if (this.cloudTasksService?.isEnabled()) {
        const taskCreated = await this.cloudTasksService.createEmailTask({
          to: params.to,
          subject: params.subject,
          html: params.html,
          notificationType: params.notificationType,
        });

        if (taskCreated) {
          this.logger.log(`📤 Email task queued for ${params.to} (type: ${params.notificationType || 'system'})`);
          return;
        }

        // If task creation failed, fallback to direct sending
        this.logger.warn('Cloud Task creation failed, falling back to direct SMTP');
      }

      // Direct SMTP sending (fallback or default)
      await this.sendWithSmtp(params);
      this.logger.log(`📧 Email sent directly to ${params.to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${params.to}`, error as Error);
      throw error;
    }
  }

  private async sendWithSmtp(params: { to: string; subject: string; html: string }): Promise<void> {
    const host = this.configService.get<string>('SMTP_HOST') || 'smtp.hostinger.com';
    const port = parseInt(this.configService.get<string>('SMTP_PORT') || '465', 10);
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');
    const sender = this.configService.get<string>('SMTP_SENDER') || user;
    const smtpSsl = this.configService.get<string>('SMTP_SSL') === 'true';

    if (!user || !pass) {
      this.logger.warn('Missing SMTP_USER/SMTP_PASS, email will not be sent');
      return;
    }

    // Hostinger port 465 uses SSL/TLS (secure: true)
    // Port 587 uses STARTTLS (secure: false)
    const secure = port === 465 || smtpSsl;

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      tls: {
        // Essential for some shared hosting environments if certificates aren't perfectly aligned
        rejectUnauthorized: false,
      },
    });

    await transporter.sendMail({
      from: sender,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
  }
}



