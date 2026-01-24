import { Module, forwardRef } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { EnhancedNotificationService } from './enhanced-notification.service';
import { NotificationTemplateService } from './notification-template.service';
import { NotificationController } from './notification.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { DevicesModule } from '../devices/devices.module';

import { WebPushService } from './web-push.service';
@Module({
  imports: [
    PrismaModule,
    DevicesModule,
  ],
  providers: [
    NotificationService,
    EnhancedNotificationService,
    NotificationTemplateService,
    WebPushService
  ],
  controllers: [NotificationController],
  exports: [
    NotificationService,
    EnhancedNotificationService,
    NotificationTemplateService,
    WebPushService
  ],
})
export class NotificationModule { }
