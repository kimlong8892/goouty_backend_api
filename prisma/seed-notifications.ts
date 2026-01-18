import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding notification templates...');

    const templates = [
        {
            code: 'forgot_password',
            title: 'Mã xác thực đổi mật khẩu',
            message: 'Mã OTP của bạn là {{otp}}. Mã này có hiệu lực trong 10 phút.',
            emailSubject: '[Goouty] Mã xác thực đổi mật khẩu',
            emailBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #2563eb; text-align: center;">Xác thực đổi mật khẩu</h2>
          <p>Xin chào <strong>{{userName}}</strong>,</p>
          <p>Bạn đã yêu cầu mã xác thực để đổi mật khẩu trên ứng dụng Goouty.</p>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #111827;">{{otp}}</span>
          </div>
          <p>Mã này có hiệu lực trong <strong>10 phút</strong>. Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #6b7280; text-align: center;">© 2025 Goouty. All rights reserved.</p>
        </div>
      `,
            icon: '🔐',
            color: '#ef4444'
        },
        {
            code: 'trip_invitation',
            title: 'Lời mời tham gia chuyến đi',
            message: '{{inviterName}} đã mời bạn tham gia chuyến đi "{{tripTitle}}"',
            emailSubject: '[Goouty] Lời mời tham gia chuyến đi: {{tripTitle}}',
            // This will use the HTML file if emailBody is empty in EnhancedNotificationService, 
            // but let's provide a basic one here too just in case.
            emailBody: '',
            icon: '📨',
            color: '#2563eb'
        },
        {
            code: 'trip_created',
            title: 'Chuyến đi mới',
            message: 'Chuyến đi "{{tripTitle}}" đã được tạo thành công!',
            emailSubject: '[Goouty] Chuyến đi mới: {{tripTitle}}',
            emailBody: '<p>Chuyến đi <strong>{{tripTitle}}</strong> đã được tạo bởi <strong>{{actionBy}}</strong> vào lúc {{createdAt}}.</p>',
            icon: '🌍',
            color: '#10b981'
        },
        {
            code: 'trip_updated',
            title: 'Chuyến đi được cập nhật',
            message: 'Chuyến đi "{{tripTitle}}" vừa có thông tin mới.',
            emailSubject: '[Goouty] Chuyến đi thay đổi: {{tripTitle}}',
            emailBody: '<p>Chuyến đi <strong>{{tripTitle}}</strong> đã được cập nhật bởi <strong>{{actionBy}}</strong> vào lúc {{updatedAt}}.</p>',
            icon: '📝',
            color: '#f59e0b'
        },
        {
            code: 'expense_added',
            title: 'Khoản chi mới',
            message: '{{actionBy}} vừa thêm khoản chi "{{expenseTitle}}" trị giá {{expenseAmount}} vào "{{tripTitle}}"',
            emailSubject: '[Goouty] Khoản chi mới trong {{tripTitle}}',
            emailBody: '<p><strong>{{actionBy}}</strong> vừa thêm khoản chi <strong>{{expenseTitle}}</strong>.</p><p>Số tiền: <strong>{{expenseAmount}}</strong></p><p>Chuyến đi: {{tripTitle}}</p>',
            icon: '💰',
            color: '#10b981'
        },
    ];

    for (const template of templates) {
        await prisma.template.upsert({
            where: { code: template.code },
            update: template,
            create: template,
        });
    }

    console.log('✅ Notification templates seeded successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding templates:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
