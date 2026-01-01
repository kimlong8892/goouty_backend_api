import { Injectable, Logger } from '@nestjs/common';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async sendTripInviteEmail(params: {
    toEmail: string;
    inviteeName?: string | null;
    tripTitle: string;
    inviterName?: string | null;
    acceptUrl: string;
  }): Promise<void> {
    const { toEmail, inviteeName, tripTitle, inviterName, acceptUrl } = params;

    const subject = `[Goouty] Lời mời tham gia chuyến đi: ${tripTitle}`;
    // Tìm template ở cả dist (prod) và src (dev)
    const candidatePaths = [
      join(__dirname, 'templates', 'trip-invite.html'),
      join(process.cwd(), 'dist', 'src', 'email', 'templates', 'trip-invite.html'),
      join(process.cwd(), 'src', 'email', 'templates', 'trip-invite.html'),
    ];
    const templatePath = candidatePaths.find((p) => existsSync(p));
    if (!templatePath) {
      throw new Error('Email template not found in expected locations');
    }
    let html = readFileSync(templatePath, 'utf8');
    html = html
      .replace(/\{\{INVITEE_NAME\}\}/g, inviteeName || toEmail)
      .replace(/\{\{INVITER_NAME\}\}/g, inviterName || 'Một người bạn')
      .replace(/\{\{TRIP_TITLE\}\}/g, tripTitle)
      .replace(/\{\{ACCEPT_URL\}\}/g, acceptUrl);

    try {
      await this.sendWithSmtp({ to: toEmail, subject, html });
      this.logger.log(`Invite email sent to ${toEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send invite email to ${toEmail}`, error as Error);
    }
  }

  async sendForgotPasswordEmail(params: {
    toEmail: string;
    name: string;
    resetUrl: string;
  }): Promise<void> {
    const { toEmail, name, resetUrl } = params;
    const subject = '[Goouty] Đặt lại mật khẩu';

    const candidatePaths = [
      join(__dirname, 'templates', 'forgot-password.html'),
      join(process.cwd(), 'dist', 'src', 'email', 'templates', 'forgot-password.html'),
      join(process.cwd(), 'src', 'email', 'templates', 'forgot-password.html'),
    ];
    const templatePath = candidatePaths.find((p) => existsSync(p));
    if (!templatePath) {
      throw new Error('Email template forgot-password.html not found');
    }

    let html = readFileSync(templatePath, 'utf8');
    html = html
      .replace(/\{\{NAME\}\}/g, name)
      .replace(/\{\{RESET_URL\}\}/g, resetUrl);

    try {
      await this.sendWithSmtp({ to: toEmail, subject, html });
      this.logger.log(`Forgot password email sent to ${toEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send forgot password email to ${toEmail}`, error as Error);
      throw error;
    }
  }

  /**
   * Send email with custom template
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
      throw new Error('Missing SMTP_USER/SMTP_PASS');
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


