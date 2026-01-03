import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

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
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT || '465', 10);
    const secure = port === 465;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM;

    if (!user || !pass) {
      this.logger.warn('Missing SMTP_USER/SMTP_PASS, email will not be sent');
      return;
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
  }
}



