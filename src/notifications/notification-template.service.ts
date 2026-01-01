import { Injectable } from '@nestjs/common';

export interface NotificationTemplate {
  title: string;
  message: string;
  emailSubject?: string;
  emailTemplate?: string;
  icon?: string;
  color?: string;
}

export interface NotificationContext {
  tripTitle?: string;
  tripId?: string;
  expenseTitle?: string;
  expenseAmount?: number;
  userName?: string;
  userEmail?: string;
  actionBy?: string;
  actionByEmail?: string;
  paymentAmount?: number;
  debtorName?: string;
  creditorName?: string;
  [key: string]: any;
}

@Injectable()
export class NotificationTemplateService {
  
  /**
   * Get notification template for different action types
   */
  getTemplate(type: string, context: NotificationContext): NotificationTemplate {
    switch (type) {
      case 'trip_created':
        return {
          title: 'Chuyến đi mới',
          message: `Chuyến đi "${context.tripTitle}" đã được tạo thành công!`,
          emailSubject: `[Goouty] Chuyến đi mới: ${context.tripTitle}`,
          emailTemplate: 'trip-created',
          icon: '✈️',
          color: '#3B82F6'
        };

      case 'trip_updated':
        return {
          title: 'Cập nhật chuyến đi',
          message: `Chuyến đi "${context.tripTitle}" đã được cập nhật`,
          emailSubject: `[Goouty] Cập nhật chuyến đi: ${context.tripTitle}`,
          emailTemplate: 'trip-updated',
          icon: '📝',
          color: '#F59E0B'
        };

      case 'trip_deleted':
        return {
          title: 'Xóa chuyến đi',
          message: `Chuyến đi "${context.tripTitle}" đã được xóa`,
          emailSubject: `[Goouty] Chuyến đi đã được xóa: ${context.tripTitle}`,
          emailTemplate: 'trip-deleted',
          icon: '🗑️',
          color: '#EF4444'
        };

      case 'expense_added':
        return {
          title: 'Chi phí mới',
          message: `Chi phí "${context.expenseTitle}" (${this.formatCurrency(context.expenseAmount)}) đã được thêm vào chuyến đi "${context.tripTitle}"`,
          emailSubject: `[Goouty] Chi phí mới: ${context.expenseTitle}`,
          emailTemplate: 'expense-added',
          icon: '💰',
          color: '#10B981'
        };

      case 'expense_updated':
        return {
          title: 'Cập nhật chi phí',
          message: `Chi phí "${context.expenseTitle}" trong chuyến đi "${context.tripTitle}" đã được cập nhật`,
          emailSubject: `[Goouty] Chi phí đã được cập nhật: ${context.expenseTitle}`,
          emailTemplate: 'expense-updated',
          icon: '📊',
          color: '#8B5CF6'
        };

      case 'payment_created':
        return {
          title: 'Thanh toán',
          message: `${context.debtorName} đã thanh toán ${this.formatCurrency(context.paymentAmount)} cho ${context.creditorName} trong chuyến đi "${context.tripTitle}"`,
          emailSubject: `[Goouty] Thanh toán mới: ${this.formatCurrency(context.paymentAmount)}`,
          emailTemplate: 'payment-created',
          icon: '💳',
          color: '#06B6D4'
        };

      case 'system_announcement':
        return {
          title: 'Thông báo hệ thống',
          message: context.message || 'Có thông báo mới từ hệ thống',
          emailSubject: `[Goouty] Thông báo hệ thống`,
          emailTemplate: 'system-announcement',
          icon: '📢',
          color: '#6B7280'
        };

      case 'info':
        return {
          title: 'Thông tin',
          message: context.message || 'Có thông tin mới',
          emailSubject: `[Goouty] Thông tin`,
          emailTemplate: 'info',
          icon: 'ℹ️',
          color: '#3B82F6'
        };

      case 'success':
        return {
          title: 'Thành công',
          message: context.message || 'Thao tác đã thành công',
          emailSubject: `[Goouty] Thành công`,
          emailTemplate: 'success',
          icon: '✅',
          color: '#10B981'
        };

      case 'warning':
        return {
          title: 'Cảnh báo',
          message: context.message || 'Có cảnh báo',
          emailSubject: `[Goouty] Cảnh báo`,
          emailTemplate: 'warning',
          icon: '⚠️',
          color: '#F59E0B'
        };

      case 'error':
        return {
          title: 'Lỗi',
          message: context.message || 'Có lỗi xảy ra',
          emailSubject: `[Goouty] Lỗi`,
          emailTemplate: 'error',
          icon: '❌',
          color: '#EF4444'
        };

      default:
        return {
          title: 'Thông báo',
          message: context.message || 'Có thông báo mới',
          emailSubject: `[Goouty] Thông báo`,
          emailTemplate: 'default',
          icon: '🔔',
          color: '#6B7280'
        };
    }
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

  /**
   * Get email template content
   */
  getEmailTemplate(templateName: string, context: NotificationContext): string {
    const templates = {
      'trip-created': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3B82F6;">Chuyến đi mới đã được tạo!</h2>
          <p>Xin chào <strong>{{userName}}</strong>,</p>
          <p>Chuyến đi "<strong>{{tripTitle}}</strong>" đã được tạo thành công bởi <strong>{{actionBy}}</strong>.</p>
          <p>Hãy truy cập ứng dụng để xem chi tiết chuyến đi.</p>
          <div style="margin-top: 20px; padding: 15px; background-color: #F3F4F6; border-radius: 8px;">
            <p><strong>Tên chuyến đi:</strong> {{tripTitle}}</p>
            <p><strong>Người tạo:</strong> {{actionBy}}</p>
            <p><strong>Thời gian:</strong> {{createdAt}}</p>
          </div>
        </div>
      `,
      'trip-updated': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #F59E0B;">Chuyến đi đã được cập nhật</h2>
          <p>Xin chào <strong>{{userName}}</strong>,</p>
          <p>Chuyến đi "<strong>{{tripTitle}}</strong>" đã được cập nhật bởi <strong>{{actionBy}}</strong>.</p>
          <p>Hãy truy cập ứng dụng để xem những thay đổi mới nhất.</p>
        </div>
      `,
      'trip-deleted': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #EF4444;">Chuyến đi đã được xóa</h2>
          <p>Xin chào <strong>{{userName}}</strong>,</p>
          <p>Chuyến đi "<strong>{{tripTitle}}</strong>" đã được xóa bởi <strong>{{actionBy}}</strong>.</p>
          <p>Nếu bạn có thắc mắc, hãy liên hệ với người quản lý chuyến đi.</p>
        </div>
      `,
      'expense-added': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10B981;">Chi phí mới đã được thêm</h2>
          <p>Xin chào <strong>{{userName}}</strong>,</p>
          <p>Chi phí "<strong>{{expenseTitle}}</strong>" với số tiền <strong>{{expenseAmount}}</strong> đã được thêm vào chuyến đi "<strong>{{tripTitle}}</strong>" bởi <strong>{{actionBy}}</strong>.</p>
          <div style="margin-top: 20px; padding: 15px; background-color: #F3F4F6; border-radius: 8px;">
            <p><strong>Tên chi phí:</strong> {{expenseTitle}}</p>
            <p><strong>Số tiền:</strong> {{expenseAmount}}</p>
            <p><strong>Chuyến đi:</strong> {{tripTitle}}</p>
            <p><strong>Người thêm:</strong> {{actionBy}}</p>
          </div>
        </div>
      `,
      'expense-updated': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #8B5CF6;">Chi phí đã được cập nhật</h2>
          <p>Xin chào <strong>{{userName}}</strong>,</p>
          <p>Chi phí "<strong>{{expenseTitle}}</strong>" trong chuyến đi "<strong>{{tripTitle}}</strong>" đã được cập nhật bởi <strong>{{actionBy}}</strong>.</p>
          <p>Hãy truy cập ứng dụng để xem những thay đổi mới nhất.</p>
        </div>
      `,
      'payment-created': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #06B6D4;">Thanh toán mới</h2>
          <p>Xin chào <strong>{{userName}}</strong>,</p>
          <p><strong>{{debtorName}}</strong> đã thanh toán <strong>{{paymentAmount}}</strong> cho <strong>{{creditorName}}</strong> trong chuyến đi "<strong>{{tripTitle}}</strong>".</p>
          <div style="margin-top: 20px; padding: 15px; background-color: #F3F4F6; border-radius: 8px;">
            <p><strong>Người trả:</strong> {{debtorName}}</p>
            <p><strong>Người nhận:</strong> {{creditorName}}</p>
            <p><strong>Số tiền:</strong> {{paymentAmount}}</p>
            <p><strong>Chuyến đi:</strong> {{tripTitle}}</p>
          </div>
        </div>
      `,
      'system-announcement': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6B7280;">Thông báo hệ thống</h2>
          <p>Xin chào <strong>{{userName}}</strong>,</p>
          <p>{{message}}</p>
        </div>
      `,
      'default': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Thông báo</h2>
          <p>Xin chào <strong>{{userName}}</strong>,</p>
          <p>{{message}}</p>
        </div>
      `
    };

    let template = templates[templateName] || templates['default'];
    
    // Replace placeholders with context values
    Object.keys(context).forEach(key => {
      const placeholder = `{{${key}}}`;
      template = template.replace(new RegExp(placeholder, 'g'), context[key] || '');
    });

    return template;
  }
}
