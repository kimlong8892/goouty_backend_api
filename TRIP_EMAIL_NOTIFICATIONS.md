# Tổng Hợp Các Trường Hợp Gửi Email Trong Trip

## 📧 Tổng Quan
Hệ thống gửi email thông qua `EnhancedNotificationService` và `EmailService`. Tất cả email đều được gửi qua template system với khả năng tùy chỉnh nội dung.

---

## 🎯 Các Trường Hợp Gửi Email Liên Quan Đến Trip

### 1. **TẠO CHUYẾN ĐI MỚI** (Trip Created)
**File:** `trips.service.ts` - dòng 93-97  
**Hàm:** `create()`  
**Notification Type:** `trip_created`

**Khi nào gửi:**
- Khi chủ sở hữu tạo một chuyến đi mới

**Gửi cho ai:**
- Tất cả thành viên của chuyến đi (nếu có)
- **KHÔNG** gửi cho người tạo chuyến đi

**Thông tin trong email:**
- Tên chuyến đi (`tripTitle`)
- Người tạo (`createdBy`)
- Thời gian tạo (`createdAt`)

**Code:**
```typescript
await this.notificationService.sendTripCreatedNotification(
  trip.id,
  trip.title,
  userId
);
```

---

### 2. **CẬP NHẬT CHUYẾN ĐI** (Trip Updated)
**File:** `trips.service.ts` - dòng 302-309  
**Hàm:** `update()`  
**Notification Type:** `trip_updated`

**Khi nào gửi:**
- Khi chủ sở hữu cập nhật thông tin chuyến đi (tên, địa điểm, ngày tháng, mô tả)

**Gửi cho ai:**
- Tất cả thành viên đã chấp nhận lời mời (`status: 'accepted'`)
- **KHÔNG** gửi cho người cập nhật

**Thông tin trong email:**
- Tên chuyến đi (`tripTitle`)
- Người cập nhật (`updatedBy`)
- Địa điểm (`location` - tên tỉnh/thành phố)
- Ngày bắt đầu (`startDate`)
- Ngày kết thúc (`endDate`)
- Link chi tiết chuyến đi (`detailUrl`)

**Code:**
```typescript
await this.notificationService.sendTripUpdatedNotification(
  id,
  updatedTrip.title,
  updater?.fullName || updater?.email || 'Một thành viên',
  fullTrip?.province?.name || '',
  fullTrip?.startDate ? fullTrip.startDate.toLocaleDateString('vi-VN') : '',
  fullTrip?.endDate ? fullTrip.endDate.toLocaleDateString('vi-VN') : ''
);
```

---

### 3. **XÓA CHUYẾN ĐI** (Trip Deleted)
**File:** `trips.service.ts` - dòng 331-335  
**Hàm:** `remove()`  
**Notification Type:** `trip_deleted`

**Khi nào gửi:**
- Khi chủ sở hữu xóa chuyến đi

**Gửi cho ai:**
- Tất cả thành viên đã chấp nhận lời mời (`status: 'accepted'`)
- **KHÔNG** gửi cho người xóa

**Thông tin trong email:**
- Tên chuyến đi (`tripTitle`)
- Người xóa (`deletedBy`)
- Thời gian xóa (`deletedAt`)

**Code:**
```typescript
await this.notificationService.sendTripDeletedNotification(
  id,
  trip.title,
  requestUserId
);
```

---

### 4. **MỜI THÀNH VIÊN MỚI** (Trip Invitation - Add Member)
**File:** `trips.service.ts` - dòng 485-502  
**Hàm:** `addMemberToTrip()`  
**Notification Type:** `trip_invitation`

**Khi nào gửi:**
- Khi chủ sở hữu mời một người dùng mới vào chuyến đi
- Khi cập nhật lời mời đang pending

**Gửi cho ai:**
- **CHỈ** người được mời (qua email)
- Có thể là người dùng đã có tài khoản hoặc chưa có tài khoản

**Thông tin trong email:**
- Tên chuyến đi (`tripTitle`)
- Người mời (`inviterName`)
- Địa điểm (`location`)
- Ngày bắt đầu (`startDate`)
- Ngày kết thúc (`endDate`)
- Email người được mời (`userEmail`)
- Tên người được mời (`userName`, `inviteeName`)
- Link chấp nhận lời mời (`acceptUrl`) - chứa `inviteToken`

**Đặc biệt:**
- `skipEmail: false` - **BẮT BUỘC** gửi email
- Email được gửi đến `normalizedEmail` (email đã chuẩn hóa)

**Code:**
```typescript
await this.notificationService.sendTripInvitationNotification(
  tripId,
  trip.title,
  userToAdd?.id || '',
  inviter?.fullName || inviter?.email || 'Một người bạn',
  (trip as any).province?.name || 'Chưa xác định',
  trip.startDate ? trip.startDate.toLocaleDateString('vi-VN') : '',
  trip.endDate ? trip.endDate.toLocaleDateString('vi-VN') : '',
  {
    skipEmail: false,
    data: {
      userEmail: normalizedEmail,
      userName: userToAdd?.fullName || addMemberDto.email.split('@')[0],
      inviteeName: userToAdd?.fullName || addMemberDto.email.split('@')[0],
      acceptUrl: `${frontendUrl}/invite?token=${inviteToken}`
    }
  }
);
```

---

### 5. **GỬI LẠI LỜI MỜI** (Resend Invitation)
**File:** `trips.service.ts` - dòng 637-654  
**Hàm:** `resendInvitation()`  
**Notification Type:** `trip_invitation`

**Khi nào gửi:**
- Khi chủ sở hữu gửi lại lời mời cho thành viên đang pending

**Gửi cho ai:**
- **CHỈ** người được mời lại (qua email)
- Chỉ áp dụng cho lời mời có `status: 'pending'`

**Thông tin trong email:**
- Giống như trường hợp "Mời thành viên mới"
- Token mời mới được tạo (`newInviteToken`)

**Đặc biệt:**
- `skipEmail: false` - **BẮT BUỘC** gửi email
- Email được lấy từ `member.invitedEmail` hoặc `member.user?.email`

**Code:**
```typescript
await this.notificationService.sendTripInvitationNotification(
  tripId,
  trip.title,
  member.userId || '',
  inviter?.fullName || inviter?.email || 'Một người bạn',
  (trip as any).province?.name || 'Chưa xác định',
  trip.startDate ? trip.startDate.toLocaleDateString('vi-VN') : '',
  trip.endDate ? trip.endDate.toLocaleDateString('vi-VN') : '',
  {
    skipEmail: false,
    data: {
      userEmail: emailToSend,
      userName: member.user?.fullName || emailToSend.split('@')[0],
      inviteeName: member.user?.fullName || emailToSend.split('@')[0],
      acceptUrl: `${frontendUrl}/invite?token=${newInviteToken}`
    }
  }
);
```

---

### 6. **LIÊN KẾT LỜI MỜI PENDING KHI ĐĂNG KÝ/ĐĂNG NHẬP** (Link Pending Invitations)
**File:** `trips.service.ts` - dòng 1017-1026  
**Hàm:** `linkPendingInvitationsByEmail()`  
**Notification Type:** `trip_invitation`

**Khi nào gửi:**
- Khi người dùng đăng ký tài khoản mới hoặc đăng nhập
- Hệ thống tự động liên kết các lời mời pending với email của họ

**Gửi cho ai:**
- **CHỈ** người dùng vừa đăng ký/đăng nhập
- Chỉ gửi notification trong app, **KHÔNG** gửi email

**Đặc biệt:**
- `skipEmail: true` - **KHÔNG** gửi email (vì email đã được gửi trước đó khi mời)
- Chỉ gửi push notification và in-app notification

**Code:**
```typescript
void this.notificationService.sendTripInvitationNotification(
  invitation.tripId,
  trip.title,
  userId,
  undefined,
  undefined, // location
  undefined, // startDate
  undefined, // endDate
  { skipEmail: true } // Email đã được gửi trước đó
);
```

---

### 7. **XÁC NHẬN THANH TOÁN** (Payment Completed)
**File:** `expenses.service.ts` - dòng 682-708  
**Hàm:** `createPaymentTransaction()`  
**Notification Type:** `payment_completed`

**Khi nào gửi:**
- Khi một thành viên xác nhận thanh toán (tạo payment transaction)
- Chỉ gửi khi `status` của transaction là `'success'`

**Gửi cho ai:**
- Tất cả thành viên đã chấp nhận lời mời (`status: 'accepted'`)
- **KHÔNG** gửi cho người thực hiện thanh toán (`paidBy`)

**Thông tin trong email:**
- Tên chuyến đi (`tripTitle`)
- Tên người nợ (`debtorName`) - người phải trả tiền
- Tên người được trả (`creditorName`) - người nhận tiền
- Số tiền thanh toán (`paymentAmount`)
- Người thực hiện thanh toán (`paidBy`)
- Thời gian thanh toán (`createdAt`)
- Link chi tiết chuyến đi (`detailUrl`)

**Đặc biệt:**
- Chỉ gửi khi transaction status là `'success'`
- Hệ thống tự động lock expenses sau khi thanh toán thành công
- Tự động tính toán lại settlements sau khi tạo transaction

**Code:**
```typescript
if ((dto.status ?? 'success') === 'success') {
  try {
    const trip = await this.prisma.trip.findUnique({
      where: { id: settlement.tripId },
      select: { title: true }
    });

    const debtor = await this.prisma.user.findUnique({
      where: { id: settlement.debtorId },
      select: { fullName: true }
    });

    const creditor = await this.prisma.user.findUnique({
      where: { id: settlement.creditorId },
      select: { fullName: true }
    });

    if (trip && debtor && creditor) {
      await this.notificationService.sendPaymentCompletedNotification(
        settlement.tripId,
        trip.title,
        debtor.fullName || 'Người dùng',
        creditor.fullName || 'Người dùng',
        dto.amount,
        userId
      );
    }
  } catch (error) {
    console.error('Failed to send payment notification:', error);
  }
}
```

**Flow xử lý:**
1. User tạo payment transaction với amount
2. Hệ thống validate amount không vượt quá remaining balance
3. Tạo transaction trong database
4. Tính toán lại settlements
5. Lock expenses nếu cần
6. **Gửi email notification** cho tất cả thành viên
7. Return transaction response

---

## 📊 Bảng Tổng Hợp

| Trường Hợp | Notification Type | Gửi Email? | Người Nhận | Trigger |
|------------|-------------------|------------|------------|---------|
| Tạo chuyến đi | `trip_created` | ✅ Có | Tất cả thành viên (trừ người tạo) | `create()` |
| Cập nhật chuyến đi | `trip_updated` | ✅ Có | Tất cả thành viên accepted (trừ người cập nhật) | `update()` |
| Xóa chuyến đi | `trip_deleted` | ✅ Có | Tất cả thành viên accepted (trừ người xóa) | `remove()` |
| Mời thành viên | `trip_invitation` | ✅ Có | Người được mời | `addMemberToTrip()` |
| Gửi lại lời mời | `trip_invitation` | ✅ Có | Người được mời lại | `resendInvitation()` |
| Liên kết lời mời pending | `trip_invitation` | ❌ Không | Người vừa đăng ký/đăng nhập | `linkPendingInvitationsByEmail()` |
| **Xác nhận thanh toán** | `payment_completed` | ✅ Có | Tất cả thành viên accepted (trừ người thanh toán) | `createPaymentTransaction()` |

---

## 🔧 Cơ Chế Gửi Email

### Flow Gửi Email:
1. **TripsService** → gọi method trong `EnhancedNotificationService`
2. **EnhancedNotificationService** → xử lý logic notification
   - Lấy template từ `NotificationTemplateService`
   - Xác định người nhận
   - Gọi `sendNotificationToUser()` cho từng người nhận
3. **sendNotificationToUser()** → gửi email qua `EmailService`
   - Tạo notification trong database
   - Gửi push notification (nếu có)
   - Gửi email (nếu `skipEmail: false`)
4. **EmailService** → gửi email thực tế qua SMTP

### Xử Lý Email HTML:
- Email HTML được clean bằng `cleanEmailHtml()` để loại bỏ Unlayer metadata
- Template variables được thay thế bằng `replacePlaceholders()`
- Email subject lấy từ `template.emailSubject` hoặc `template.title`

---

## 🎨 Template Variables

Các biến có thể sử dụng trong email template:

### Chung:
- `{{tripTitle}}` - Tên chuyến đi
- `{{tripId}}` - ID chuyến đi
- `{{actionBy}}` - Người thực hiện hành động
- `{{userName}}` - Tên người nhận
- `{{userEmail}}` - Email người nhận

### Trip Invitation:
- `{{inviterName}}` - Tên người mời
- `{{inviteeName}}` - Tên người được mời
- `{{location}}` - Địa điểm
- `{{startDate}}` - Ngày bắt đầu
- `{{endDate}}` - Ngày kết thúc
- `{{acceptUrl}}` - Link chấp nhận lời mời

### Trip Updated:
- `{{updatedAt}}` - Thời gian cập nhật
- `{{detailUrl}}` - Link chi tiết chuyến đi

### Trip Deleted:
- `{{deletedAt}}` - Thời gian xóa

### Payment Completed:
- `{{debtorName}}` - Tên người nợ (người phải trả)
- `{{creditorName}}` - Tên người được trả (người nhận tiền)
- `{{paymentAmount}}` - Số tiền thanh toán (đã format VND)
- `{{createdAt}}` - Thời gian thanh toán
- `{{detailUrl}}` - Link chi tiết chuyến đi

---

## ⚙️ Cấu Hình

### Environment Variables:
- `APP_URL` - URL frontend để tạo link trong email
- SMTP settings trong `EmailService`

### Điều Kiện Gửi:
- User phải có `notificationsEnabled: true`
- Thành viên phải có `status: 'accepted'` (trừ trường hợp invitation)
- Không gửi cho chính người thực hiện hành động (trừ invitation)

---

## 📝 Lưu Ý Quan Trọng

1. **Email cho người chưa có tài khoản:**
   - Hệ thống vẫn gửi email được cho người chưa đăng ký
   - Sử dụng `invitedEmail` để lưu email
   - `userId` có thể là `null`

2. **Token bảo mật:**
   - Mỗi lời mời có `inviteToken` unique
   - Token được tạo mới khi resend invitation
   - Token được xóa khi chấp nhận lời mời

3. **Error Handling:**
   - Lỗi gửi email không làm fail toàn bộ transaction
   - Chỉ log error và tiếp tục xử lý

4. **Performance:**
   - Email được gửi bất đồng bộ
   - Không block main flow của ứng dụng

---

## 🔍 Debugging

Để debug email, kiểm tra:
1. Logs trong `EnhancedNotificationService`
2. Database table `Notification` để xem notification đã được tạo chưa
3. Email service logs để xem email đã được gửi chưa
4. Template trong database (`Templates` table)

---

**Tạo bởi:** Antigravity AI  
**Ngày:** 2026-01-18  
**Version:** 1.0
