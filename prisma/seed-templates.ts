import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const templates = [
    {
        code: 'trip_invitation',
        title: 'Lời mời tham gia chuyến đi',
        message: 'Bạn đã được mời tham gia chuyến đi "{{tripTitle}}" bởi {{inviterName}}',
        emailSubject: '[Goouty] Lời mời tham gia chuyến đi: {{tripTitle}}',
        emailBody: `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Lời mời tham gia chuyến đi</title>
  <style>
    body { font-family: Arial, sans-serif; background:#f6f9fc; color:#222; }
    .container { max-width:600px; margin:0 auto; background:#ffffff; padding:24px; border-radius:8px; }
    .btn { display:inline-block; padding:12px 18px; background:#2563eb; color:#ffffff !important; text-decoration:none; border-radius:6px; }
    .muted { color:#6b7280; font-size:12px; }
  </style>
</head>
<body>
  <div class="container">
    <h2>📨 Lời mời tham gia chuyến đi</h2>
    <p>Xin chào {{inviteeName}},</p>
    <p><strong>{{inviterName}}</strong> đã mời bạn tham gia chuyến đi <strong>"{{tripTitle}}"</strong> trên GoOuty.</p>
    <p>Nếu bạn đồng ý tham gia, vui lòng nhấn nút bên dưới:</p>
    <p>
      <a class="btn" href="{{acceptUrl}}" target="_blank">Chấp nhận lời mời</a>
    </p>
    <p class="muted" style="margin-top: 16px; padding: 12px; background: #f3f4f6; border-radius: 6px;">
      <strong>💡 Lưu ý:</strong> Nếu bạn chưa có tài khoản GoOuty, bạn sẽ được hướng dẫn đăng ký (bằng email hoặc Google) trước khi chấp nhận lời mời. Sau khi đăng ký, lời mời sẽ tự động được kích hoạt.
    </p>
    <p class="muted">Nếu bạn không muốn tham gia, bạn có thể bỏ qua email này.</p>
    <hr />
    <p class="muted">Email được gửi tự động từ hệ thống GoOuty.</p>
  </div>
</body>
</html>`,
        icon: '✉️',
        color: '#6c5dd3'
    },
    {
        code: 'forgot_password',
        title: 'Đặt lại mật khẩu',
        message: 'Yêu cầu đặt lại mật khẩu cho tài khoản Goouty của bạn.',
        emailSubject: '[Goouty] Đặt lại mật khẩu',
        emailBody: `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Đặt lại mật khẩu Goouty</title>
    <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        h2 { color: #333; }
        p { line-height: 1.6; color: #555; }
        .btn { display: inline-block; padding: 10px 20px; background-color: #007bff; color: #fff; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px; }
        .footer { margin-top: 30px; font-size: 12px; color: #999; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <h2>Đặt lại mật khẩu</h2>
        <p>Xin chào {{name}},</p>
        <p>Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản Goouty của bạn.</p>
        <p>Vui lòng nhấp vào nút bên dưới để đặt lại mật khẩu của bạn:</p>
        <a href="{{resetUrl}}" class="btn">Đặt lại mật khẩu</a>
        <p>Liên kết này sẽ hết hạn sau 15 phút.</p>
        <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
        <div class="footer">
            &copy; 2025 Goouty. All rights reserved.
        </div>
    </div>
</body>
</html>`,
        icon: '🔑',
        color: '#EF4444'
    },
    {
        code: 'trip_created',
        title: 'Chuyến đi mới',
        message: 'Chuyến đi "{{tripTitle}}" đã được tạo thành công!',
        emailSubject: '[Goouty] Chuyến đi mới: {{tripTitle}}',
        emailBody: `
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
        icon: '✈️',
        color: '#3B82F6'
    },
    {
        code: 'trip_updated',
        title: 'Cập nhật chuyến đi',
        message: 'Chuyến đi "{{tripTitle}}" đã được cập nhật',
        emailSubject: '[Goouty] Cập nhật chuyến đi: {{tripTitle}}',
        emailBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #F59E0B;">Chuyến đi đã được cập nhật</h2>
          <p>Xin chào <strong>{{userName}}</strong>,</p>
          <p>Chuyến đi "<strong>{{tripTitle}}</strong>" đã được cập nhật bởi <strong>{{actionBy}}</strong>.</p>
          <p>Hãy truy cập ứng dụng để xem những thay đổi mới nhất.</p>
        </div>
      `,
        icon: '📝',
        color: '#F59E0B'
    },
    {
        code: 'trip_deleted',
        title: 'Xóa chuyến đi',
        message: 'Chuyến đi "{{tripTitle}}" đã được xóa',
        emailSubject: '[Goouty] Chuyến đi đã được xóa: {{tripTitle}}',
        emailBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #EF4444;">Chuyến đi đã được xóa</h2>
          <p>Xin chào <strong>{{userName}}</strong>,</p>
          <p>Chuyến đi "<strong>{{tripTitle}}</strong>" đã được xóa bởi <strong>{{actionBy}}</strong>.</p>
          <p>Nếu bạn có thắc mắc, hãy liên hệ với người quản lý chuyến đi.</p>
        </div>
      `,
        icon: '🗑️',
        color: '#EF4444'
    },
    {
        code: 'expense_added',
        title: 'Chi phí mới',
        message: 'Chi phí "{{expenseTitle}}" ({{expenseAmount}}) đã được thêm vào chuyến đi "{{tripTitle}}"',
        emailSubject: '[Goouty] Chi phí mới: {{expenseTitle}}',
        emailBody: `
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
        icon: '💰',
        color: '#10B981'
    },
    {
        code: 'expense_updated',
        title: 'Cập nhật chi phí',
        message: 'Chi phí "{{expenseTitle}}" trong chuyến đi "{{tripTitle}}" đã được cập nhật',
        emailSubject: '[Goouty] Chi phí đã được cập nhật: {{expenseTitle}}',
        emailBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #8B5CF6;">Chi phí đã được cập nhật</h2>
          <p>Xin chào <strong>{{userName}}</strong>,</p>
          <p>Chi phí "<strong>{{expenseTitle}}</strong>" trong chuyến đi "<strong>{{tripTitle}}</strong>" đã được cập nhật bởi <strong>{{actionBy}}</strong>.</p>
          <p>Hãy truy cập ứng dụng để xem những thay đổi mới nhất.</p>
        </div>
      `,
        icon: '📊',
        color: '#8B5CF6'
    },
    {
        code: 'payment_created',
        title: 'Thanh toán',
        message: '{{debtorName}} đã thanh toán {{paymentAmount}} cho {{creditorName}} trong chuyến đi "{{tripTitle}}"',
        emailSubject: '[Goouty] Thanh toán mới: {{paymentAmount}}',
        emailBody: `
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
        icon: '💳',
        color: '#06B6D4'
    },
    {
        code: 'system_announcement',
        title: 'Thông báo hệ thống',
        message: '{{message}}',
        emailSubject: '[Goouty] Thông báo hệ thống',
        emailBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6B7280;">Thông báo hệ thống</h2>
          <p>Xin chào <strong>{{userName}}</strong>,</p>
          <p>{{message}}</p>
        </div>
      `,
        icon: '📢',
        color: '#6B7280'
    },
    {
        code: 'info',
        title: 'Thông tin',
        message: '{{message}}',
        emailSubject: '[Goouty] Thông tin',
        emailBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3B82F6;">Thông tin</h2>
          <p>Xin chào <strong>{{userName}}</strong>,</p>
          <p>{{message}}</p>
        </div>
      `,
        icon: 'ℹ️',
        color: '#3B82F6'
    },
    {
        code: 'success',
        title: 'Thành công',
        message: '{{message}}',
        emailSubject: '[Goouty] Thành công',
        emailBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10B981;">Thành công</h2>
          <p>Xin chào <strong>{{userName}}</strong>,</p>
          <p>{{message}}</p>
        </div>
      `,
        icon: '✅',
        color: '#10B981'
    },
    {
        code: 'warning',
        title: 'Cảnh báo',
        message: '{{message}}',
        emailSubject: '[Goouty] Cảnh báo',
        emailBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #F59E0B;">Cảnh báo</h2>
          <p>Xin chào <strong>{{userName}}</strong>,</p>
          <p>{{message}}</p>
        </div>
      `,
        icon: '⚠️',
        color: '#F59E0B'
    },
    {
        code: 'error',
        title: 'Lỗi',
        message: '{{message}}',
        emailSubject: '[Goouty] Lỗi',
        emailBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #EF4444;">Lỗi</h2>
          <p>Xin chào <strong>{{userName}}</strong>,</p>
          <p>{{message}}</p>
        </div>
      `,
        icon: '❌',
        color: '#EF4444'
    },
    {
        code: 'default',
        title: 'Thông báo',
        message: '{{message}}',
        emailSubject: '[Goouty] Thông báo',
        emailBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Thông báo</h2>
          <p>Xin chào <strong>{{userName}}</strong>,</p>
          <p>{{message}}</p>
        </div>
      `,
        icon: '🔔',
        color: '#6B7280'
    }
];

async function main() {
    console.log('🌱 Seeding templates...');
    for (const template of templates) {
        await prisma.template.upsert({
            where: { code: template.code },
            update: template,
            create: template,
        });
    }
    console.log('✅ Templates seeded successfully');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
