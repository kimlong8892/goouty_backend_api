# Cloud Tasks Email Integration

## 📋 Tổng quan

Hệ thống email đã được tích hợp với Google Cloud Tasks để gửi email bất đồng bộ (async), cải thiện hiệu suất API và độ tin cậy.

## 🎯 Lợi ích

- **Async Processing**: Email được xử lý bất đồng bộ, không block API response
- **Retry Logic**: Cloud Tasks tự động retry khi gửi email thất bại
- **Scalability**: Dễ dàng scale với traffic cao
- **Queue Management**: Quản lý email theo loại notification với các queue riêng biệt
- **Fallback**: Tự động fallback về SMTP trực tiếp nếu Cloud Tasks không khả dụng

## 🗂️ Queue Structure

Hệ thống sử dụng 4 queue riêng biệt cho các loại notification:

| Queue | Notification Types | Mô tả |
|-------|-------------------|-------|
| `QUEUE_TRIP` | `trip_created`, `trip_updated`, `trip_deleted`, `trip_invitation` | Thông báo liên quan đến chuyến đi |
| `QUEUE_EXPENSE` | `expense_added`, `expense_updated` | Thông báo liên quan đến chi phí |
| `QUEUE_PAYMENT` | `payment_completed`, `settlement_created` | Thông báo liên quan đến thanh toán |
| `QUEUE_SYSTEM` | `system_announcement`, các loại khác | Thông báo hệ thống và các loại khác |

## ⚙️ Cấu hình

### 1. Environment Variables

Thêm các biến sau vào file `.env` hoặc env config:

```bash
# Bật/tắt Cloud Tasks
USE_CLOUD_TASKS=true

# GCP Configuration
GCP_PROJECT_ID=your-gcp-project-id
GCP_LOCATION=asia-southeast1
CLOUD_TASKS_SERVICE_URL=https://your-app-url.com

# Queue Names
QUEUE_TRIP=queue-trip-notifications-dev
QUEUE_EXPENSE=queue-expense-notifications-dev
QUEUE_PAYMENT=queue-payment-notifications-dev
QUEUE_SYSTEM=queue-system-notifications-dev
```

### 2. GCP Service Account

Đảm bảo service account có quyền:
- `cloudtasks.tasks.create`
- `cloudtasks.queues.get`

### 3. Tạo Queues trên GCP

```bash
# Tạo queue cho trip notifications
gcloud tasks queues create queue-trip-notifications-dev \
  --location=asia-southeast1

# Tạo queue cho expense notifications
gcloud tasks queues create queue-expense-notifications-dev \
  --location=asia-southeast1

# Tạo queue cho payment notifications
gcloud tasks queues create queue-payment-notifications-dev \
  --location=asia-southeast1

# Tạo queue cho system notifications
gcloud tasks queues create queue-system-notifications-dev \
  --location=asia-southeast1
```

## 🔄 Flow hoạt động

```
1. User action (e.g., create payment)
   ↓
2. EnhancedNotificationService.sendPaymentCompletedNotification()
   ↓
3. EmailService.sendEmail({ notificationType: 'payment_completed' })
   ↓
4. CloudTasksService.createEmailTask()
   ├─ Determine queue: QUEUE_PAYMENT
   ├─ Create task in Cloud Tasks
   └─ Return immediately
   ↓
5. API response (fast!)
   ↓
6. Cloud Tasks calls: POST /api/internal/send-email
   ↓
7. InternalController.sendEmail()
   ↓
8. EmailService.sendWithSmtp()
   ↓
9. Email sent via SMTP
```

## 🧪 Testing

### Test với Cloud Tasks disabled

```bash
USE_CLOUD_TASKS=false
```

Email sẽ được gửi trực tiếp qua SMTP (synchronous).

### Test với Cloud Tasks enabled

```bash
USE_CLOUD_TASKS=true
```

Email sẽ được queue vào Cloud Tasks (asynchronous).

### Kiểm tra logs

```bash
# Khi tạo task
📤 Creating Cloud Task for email to: user@example.com (queue: queue-payment-notifications-dev, type: payment)
✅ Cloud Task created: projects/xxx/locations/asia-southeast1/queues/queue-payment-notifications-dev/tasks/xxx

# Khi xử lý task
📧 [CLOUD_TASK] Processing email task for: user@example.com
✅ [CLOUD_TASK] Email sent successfully to: user@example.com
```

## 🔒 Security

Endpoint `/api/internal/send-email` nên được bảo vệ:

1. **Cloud Tasks Service Account**: Chỉ cho phép requests từ Cloud Tasks
2. **IP Whitelist**: Chỉ cho phép IP của GCP
3. **Authentication Header**: Validate request header từ Cloud Tasks

## 📊 Monitoring

### Cloud Tasks Console
- Xem số lượng tasks trong queue
- Monitor retry attempts
- Xem task execution logs

### Application Logs
- Email queued: `📤 Email task queued for...`
- Email sent: `✅ [CLOUD_TASK] Email sent successfully...`
- Errors: `❌ Failed to create Cloud Task...`

## 🚨 Troubleshooting

### Email không được gửi

1. Kiểm tra `USE_CLOUD_TASKS` setting
2. Kiểm tra GCP credentials
3. Kiểm tra queue tồn tại trên GCP
4. Kiểm tra service URL đúng
5. Xem logs trong Cloud Tasks console

### Fallback to SMTP

Nếu Cloud Tasks fail, hệ thống tự động fallback về SMTP trực tiếp:

```
⚠️ Cloud Task creation failed, falling back to direct SMTP
📧 Email sent directly to user@example.com
```

## 📝 Notes

- **Development**: Nên set `USE_CLOUD_TASKS=false` để test nhanh
- **Production**: Nên set `USE_CLOUD_TASKS=true` để tận dụng async processing
- **Retry**: Cloud Tasks tự động retry failed tasks (configurable)
- **Dead Letter Queue**: Có thể config DLQ cho tasks failed nhiều lần

## 🔗 Related Files

- `src/cloud-tasks/cloud-tasks.service.ts` - Cloud Tasks service
- `src/email/email.service.ts` - Email service với Cloud Tasks integration
- `src/internal/internal.controller.ts` - Endpoint xử lý Cloud Tasks callback
- `src/notifications/enhanced-notification.service.ts` - Notification service
