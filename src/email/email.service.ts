import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) { }

  /**
   * Send email with custom template (HTML)
   */
  async sendEmail(params: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    try {
      await this.sendWithSmtp(params);
      this.logger.log(`Email sent to ${params.to}`);
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



