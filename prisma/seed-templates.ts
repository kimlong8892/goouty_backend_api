import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding notification templates...');

  const templates = [
    {
      code: 'auth_otp',
      title: 'Mã xác thực Goouty',
      message: 'Mã OTP của bạn là {{otp}}. Mã này có hiệu lực trong 10 phút.',
      emailSubject: '[Goouty] Mã xác thực của bạn',
      emailBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #2563eb; text-align: center;">Mã xác thực OTP</h2>
          <p>Xin chào <strong>{{userName}}</strong>,</p>
          <p>Bạn đã yêu cầu mã xác thực OTP trên ứng dụng Goouty.</p>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #111827;">{{otp}}</span>
          </div>
          <p>Mã này có hiệu lực trong <strong>10 phút</strong>. Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #6b7280; text-align: center;">© 2025 Goouty. All rights reserved.</p>
        </div>
      `,
      icon: '🔐',
      color: '#ef4444',
      variables: ['userName', 'otp', 'userEmail']
    },
    {
      code: 'forgot_password',
      title: 'Đặt lại mật khẩu Goouty',
      message: 'Nhấp vào liên kết để đặt lại mật khẩu cho tài khoản Goouty của bạn.',
      emailSubject: '[Goouty] Yêu cầu đặt lại mật khẩu',
      emailBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #2563eb; text-align: center;">Đặt lại mật khẩu</h2>
          <p>Xin chào <strong>{{userName}}</strong>,</p>
          <p>Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản Goouty của bạn.</p>
          <p>Vui lòng nhấp vào nút bên dưới để đặt lại mật khẩu của bạn:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{resetUrl}}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Đặt lại mật khẩu</a>
          </div>
          <p>Liên kết này sẽ hết hạn sau <strong>15 phút</strong>.</p>
          <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #6b7280; text-align: center;">© 2025 Goouty. All rights reserved.</p>
        </div>
      `,
      icon: '🔑',
      color: '#3b82f6',
      variables: ['userName', 'resetUrl', 'frontendUrl']
    },
    {
      code: 'trip_invitation',
      title: 'Lời mời tham gia chuyến đi',
      message: '{{inviterName}} đã mời bạn tham gia chuyến đi "{{tripTitle}}"',
      emailSubject: '[Goouty] Lời mời tham gia chuyến đi: {{tripTitle}}',
      emailBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #2563eb; text-align: center;">Lời mời tham gia chuyến đi</h2>
          <p>Xin chào <strong>{{userName}}</strong>,</p>
          <p><strong>{{inviterName}}</strong> đã mời bạn tham gia chuyến đi <strong>"{{tripTitle}}"</strong> trên Goouty.</p>
          <div style="background-color: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>📍 Địa điểm:</strong> {{location}}</p>
            <p style="margin: 5px 0;"><strong>📅 Thời gian:</strong> {{startDate}} - {{endDate}}</p>
          </div>
          <p>Nếu bạn đồng ý tham gia, vui lòng nhấn nút bên dưới:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{acceptUrl}}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Chấp nhận lời mời</a>
          </div>
          <p style="color: #6b7280; font-size: 14px; background-color: #f3f4f6; padding: 15px; border-radius: 5px;">
            <strong>Lưu ý:</strong> Nếu bạn chưa có tài khoản Goouty, bạn sẽ được hướng dẫn đăng ký trước khi chấp nhận lời mời.
          </p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #6b7280; text-align: center;">© 2025 Goouty. All rights reserved.</p>
        </div>
      `,
      icon: '📨',
      color: '#2563eb',
      variables: ['userName', 'inviterName', 'tripTitle', 'acceptUrl', 'location', 'startDate', 'endDate']
    },
    {
      code: 'trip_created',
      title: 'Chuyến đi mới',
      message: 'Chuyến đi "{{tripTitle}}" đã được tạo thành công!',
      emailSubject: '[Goouty] Chuyến đi mới: {{tripTitle}}',
      emailBody: '<p>Chuyến đi <strong>{{tripTitle}}</strong> đã được tạo bởi <strong>{{actionBy}}</strong> vào lúc {{createdAt}}.</p>',
      icon: '🌍',
      color: '#10b981',
      variables: ['tripTitle', 'actionBy', 'createdAt']
    },
    {
      code: 'trip_updated',
      title: 'Chuyến đi được cập nhật',
      message: 'Chuyến đi "{{tripTitle}}" vừa có thông tin mới.',
      emailSubject: '[Goouty] Chuyến đi thay đổi: {{tripTitle}}',
      emailBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #f59e0b; text-align: center;">Chuyến đi đã cập nhật</h2>
          <p>Xin chào <strong>{{userName}}</strong>,</p>
          <p>Chuyến đi <strong>{{tripTitle}}</strong> đã được cập nhật bởi <strong>{{actionBy}}</strong>.</p>
          <div style="background-color: #fffbeb; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #fef3c7;">
            <p style="margin: 5px 0;"><strong>📍 Địa điểm:</strong> {{location}}</p>
            <p style="margin: 5px 0;"><strong>📅 Thời gian:</strong> {{startDate}} - {{endDate}}</p>
            <p style="margin: 5px 0;"><strong>⏰ Cập nhật lúc:</strong> {{updatedAt}}</p>
          </div>
          <p>Vui lòng nhấp vào nút bên dưới để xem chi tiết các thay đổi:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{detailUrl}}" style="background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Xem chi tiết chuyến đi</a>
          </div>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #6b7280; text-align: center;">© 2025 Goouty. All rights reserved.</p>
        </div>
      `,
      icon: '📝',
      color: '#f59e0b',
      variables: ['tripTitle', 'actionBy', 'updatedAt', 'detailUrl', 'location', 'startDate', 'endDate', 'inviterName']
    },
    {
      code: 'trip_deleted',
      title: 'Chuyến đi đã bị xoá',
      message: 'Chuyến đi "{{tripTitle}}" đã bị xoá.',
      emailSubject: '[Goouty] Chuyến đi đã bị xoá: {{tripTitle}}',
      emailBody: '<p>Chuyến đi <strong>{{tripTitle}}</strong> đã bị xoá bởi <strong>{{actionBy}}</strong> vào lúc {{deletedAt}}.</p>',
      icon: '🗑️',
      color: '#ef4444',
      variables: ['tripTitle', 'actionBy', 'deletedAt']
    },
    {
      code: 'expense_added',
      title: 'Khoản chi mới',
      message: '{{actionBy}} vừa thêm khoản chi "{{expenseTitle}}" trị giá {{expenseAmount}} vào "{{tripTitle}}"',
      emailSubject: '[Goouty] Khoản chi mới trong {{tripTitle}}',
      emailBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #10b981; text-align: center;">Khoản chi mới</h2>
          <p><strong>{{actionBy}}</strong> vừa thêm một khoản chi mới vào chuyến đi <strong>{{tripTitle}}</strong>.</p>
          <div style="background-color: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>💰 Khoản chi:</strong> {{expenseTitle}}</p>
            <p style="margin: 5px 0;"><strong>💵 Số tiền:</strong> {{expenseAmount}}</p>
            <p style="margin: 5px 0;"><strong>⏰ Thời gian:</strong> {{createdAt}}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{detailUrl}}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Chi tiết chuyến đi</a>
          </div>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #6b7280; text-align: center;">© 2025 Goouty. All rights reserved.</p>
        </div>
      `,
      icon: '💰',
      color: '#10b981',
      variables: ['tripTitle', 'expenseTitle', 'expenseAmount', 'actionBy', 'createdAt', 'detailUrl']
    },
    {
      code: 'expense_updated',
      title: 'Khoản chi đã cập nhật',
      message: 'Khoản chi "{{expenseTitle}}" trong chuyến đi "{{tripTitle}}" đã được cập nhật.',
      emailSubject: '[Goouty] Khoản chi cập nhật: {{expenseTitle}}',
      emailBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #f59e0b; text-align: center;">Khoản chi cập nhật</h2>
          <p>Khoản chi <strong>{{expenseTitle}}</strong> trong chuyến đi <strong>{{tripTitle}}</strong> đã được cập nhật bởi <strong>{{actionBy}}</strong>.</p>
          <div style="background-color: #fffbeb; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #fef3c7;">
             <p style="margin: 5px 0;"><strong>💰 Số tiền mới:</strong> {{expenseAmount}}</p>
             <p style="margin: 5px 0;"><strong>⏰ Cập nhật lúc:</strong> {{updatedAt}}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{detailUrl}}" style="background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Xem chi tiết</a>
          </div>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #6b7280; text-align: center;">© 2025 Goouty. All rights reserved.</p>
        </div>
      `,
      icon: '💸',
      color: '#f59e0b',
      variables: ['tripTitle', 'expenseTitle', 'expenseAmount', 'actionBy', 'updatedAt', 'detailUrl']
    },
    {
      code: 'payment_created',
      title: 'Yêu cầu quyết toán',
      message: '{{actionBy}} vừa tạo yêu cầu quyết toán {{paymentAmount}} cho "{{tripTitle}}"',
      emailSubject: '[Goouty] Yêu cầu quyết toán mới',
      emailBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #3b82f6; text-align: center;">Yêu cầu quyết toán</h2>
          <p><strong>{{actionBy}}</strong> vừa tạo một yêu cầu quyết toán mới.</p>
          <div style="background-color: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>👤 Người nợ:</strong> {{debtorName}}</p>
            <p style="margin: 5px 0;"><strong>👤 Người nhận:</strong> {{creditorName}}</p>
            <p style="margin: 5px 0;"><strong>💵 Số tiền:</strong> {{paymentAmount}}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{detailUrl}}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Đi tới chuyến đi</a>
          </div>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #6b7280; text-align: center;">© 2025 Goouty. All rights reserved.</p>
        </div>
      `,
      icon: '💳',
      color: '#3b82f6',
      variables: ['tripTitle', 'debtorName', 'creditorName', 'paymentAmount', 'actionBy', 'createdAt', 'detailUrl']
    },
    {
      code: 'payment_completed',
      title: 'Quyết toán hoàn tất',
      message: '{{debtorName}} đã thanh toán {{paymentAmount}} cho {{creditorName}} trong "{{tripTitle}}"',
      emailSubject: '[Goouty] Xác nhận thanh toán: {{paymentAmount}}',
      emailBody: '<p><strong>{{debtorName}}</strong> đã xác nhận thanh toán số tiền <strong>{{paymentAmount}}</strong> cho <strong>{{creditorName}}</strong>.</p><p>Chuyến đi: {{tripTitle}}</p>',
      icon: '✅',
      color: '#10b981',
      variables: ['tripTitle', 'debtorName', 'creditorName', 'paymentAmount', 'actionBy', 'createdAt']
    },
    {
      code: 'system_announcement',
      title: 'Thông báo hệ thống',
      message: '{{message}}',
      emailSubject: '[Goouty] Thông báo từ hệ thống',
      emailBody: '<p>{{message}}</p>',
      icon: '📢',
      color: '#6366f1',
      variables: ['message', 'createdAt']
    },
    {
      code: 'info',
      title: 'Thông tin',
      message: '{{message}}',
      emailSubject: '[Goouty] Thông tin mới',
      emailBody: '<p>{{message}}</p>',
      icon: 'ℹ️',
      color: '#3b82f6',
      variables: ['message', 'createdAt']
    },
    {
      code: 'success',
      title: 'Thành công',
      message: '{{message}}',
      emailSubject: '[Goouty] Thông báo thành công',
      emailBody: '<p>{{message}}</p>',
      icon: '✅',
      color: '#10b981',
      variables: ['message', 'createdAt']
    },
    {
      code: 'warning',
      title: 'Cảnh báo',
      message: '{{message}}',
      emailSubject: '[Goouty] Cảnh báo quan trọng',
      emailBody: '<p>{{message}}</p>',
      icon: '⚠️',
      color: '#f59e0b',
      variables: ['message', 'createdAt']
    },
    {
      code: 'error',
      title: 'Lỗi',
      message: '{{message}}',
      emailSubject: '[Goouty] Thông báo lỗi',
      emailBody: '<p>{{message}}</p>',
      icon: '❌',
      color: '#ef4444',
      variables: ['message', 'createdAt']
    },
    {
      code: 'default',
      title: 'Thông báo',
      message: '{{message}}',
      emailSubject: '[Goouty] Thông báo mới',
      emailBody: '<p>{{message}}</p>',
      icon: '🔔',
      color: '#6b7280',
      variables: ['message', 'createdAt']
    }
  ];

  // Bước 1: Đảm bảo tất cả template tồn tại
  for (const template of templates) {
    const exists = await prisma.template.findUnique({
      where: { code: template.code },
    });

    if (!exists) {
      console.log(`🌱 Creating new template: ${template.code}`);
      await prisma.template.create({
        data: template,
      });
    }
  }

  // Bước 2: Kiểm tra và cập nhật variables nếu có sự khác biệt so với seed
  console.log('🔍 Checking for variables sync...');
  for (const template of templates) {
    const existing = await prisma.template.findUnique({
      where: { code: template.code },
      select: { id: true, variables: true, code: true }
    });

    if (existing) {
      const dbVars = Array.isArray(existing.variables) ? existing.variables : [];
      const seedVars = Array.isArray(template.variables) ? template.variables : [];

      // So sánh sau khi sort để không phụ thuộc vào thứ tự phần tử
      const isDifferent = JSON.stringify([...dbVars].sort()) !== JSON.stringify([...seedVars].sort());

      if (isDifferent) {
        console.log(`🔄 Updating variables for: ${template.code}`);
        await prisma.template.update({
          where: { id: existing.id },
          data: { variables: seedVars },
        });
      }
    }
  }

  console.log('✅ Template sync completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding templates:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
