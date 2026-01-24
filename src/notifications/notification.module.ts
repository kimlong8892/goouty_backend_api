import { Module, forwardRef } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { EnhancedNotificationService } from './enhanced-notification.service';
import { NotificationTemplateService } from './notification-template.service';
import { NotificationController } from './notification.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
  ],
  providers: [
    NotificationService,
    EnhancedNotificationService,
    NotificationTemplateService,
  ],
  controllers: [NotificationController],
  exports: [
    NotificationService,
    EnhancedNotificationService,
    NotificationTemplateService,
  ],
})
export class NotificationModule { }
