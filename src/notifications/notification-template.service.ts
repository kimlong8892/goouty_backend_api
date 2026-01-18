import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface NotificationTemplate {
  title: string;
  message: string;
  emailSubject?: string;
  emailTemplate?: string;
  emailBody?: string;
  icon?: string;
  color?: string;
}

export interface NotificationContext {
  tripTitle?: string;
  tripId?: string;
  expenseTitle?: string;
  expenseAmount?: number | string;
  userName?: string;
  userEmail?: string;
  actionBy?: string;
  actionByEmail?: string;
  paymentAmount?: number | string;
  debtorName?: string;
  creditorName?: string;
  detailUrl?: string;
  [key: string]: any;
}

@Injectable()
export class NotificationTemplateService {
  private readonly logger = new Logger(NotificationTemplateService.name);
  constructor(private prisma: PrismaService) { }

  /**
   * Get notification template for different action types
   */
  async getTemplate(type: string, context: NotificationContext): Promise<NotificationTemplate> {
    try {
      const code = type.toLowerCase();

      const templateData = await this.prisma.template.findUnique({
        where: { code },
      });

      // Fallback to default if not found
      if (!templateData && type !== 'default') {
        return this.getTemplate('default', context);
      }

      if (!templateData) {
        // Absolute fallback
        return {
          title: 'Thông báo',
          message: context.message || 'Có thông báo mới',
          emailSubject: `[Goouty] Thông báo`,
          icon: '🔔',
          color: '#6B7280'
        };
      }

      return {
        title: this.replacePlaceholders(templateData.title || '', context),
        message: this.replacePlaceholders(templateData.message || '', context),
        emailSubject: this.replacePlaceholders(templateData.emailSubject || '', context),
        emailTemplate: templateData.emailBody || '', // Keep for compatibility
        emailBody: templateData.emailBody || '', // Added to match user terminology
        icon: templateData.icon || '🔔',
        color: templateData.color || '#6B7280'
      };
    } catch (error) {
      this.logger.error(`Error getting template for ${type}:`, error);
      return {
        title: 'Thông báo',
        message: context.message || 'Có thông báo mới',
        icon: '🔔',
        color: '#6B7280'
      };
    }
  }

  /**
   * Get email template content
   */
  async getEmailTemplate(templateCode: string, context: NotificationContext): Promise<string> {
    try {
      const code = templateCode.toLowerCase();

      const templateData = await this.prisma.template.findUnique({
        where: { code },
      });

      const html = templateData?.emailBody || '';
      return this.replacePlaceholders(html, context);
    } catch (error) {
      this.logger.error(`Error getting email template for ${templateCode}:`, error);
      return '';
    }
  }

  /**
   * Replace placeholders with context values
   */
  public replacePlaceholders(template: string, context: NotificationContext): string {
    if (!template) return '';

    let result = template;

    // Format some specific types if they are numbers
    const formattedContext = { ...context };
    if (typeof context.expenseAmount === 'number') {
      formattedContext.expenseAmount = this.formatCurrency(context.expenseAmount);
    }
    if (typeof context.paymentAmount === 'number') {
      formattedContext.paymentAmount = this.formatCurrency(context.paymentAmount);
    }

    Object.keys(formattedContext).forEach(key => {
      const placeholder = `{{${key}}}`;
      const value = formattedContext[key];
      if (value !== undefined && value !== null) {
        result = result.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), String(value));
      }
    });

    return result;
  }

  /**
   * Format currency for Vietnamese locale
   */
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }

}

