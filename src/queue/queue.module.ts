import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QueueService } from './queue.service';
import { QueueController } from './queue.controller';
import { BullMQBoardService } from './bullmq-board.service';
import { TripNotificationProcessor } from './processors/trip-notification.processor';
import { ExpenseNotificationProcessor } from './processors/expense-notification.processor';
import { PaymentNotificationProcessor } from './processors/payment-notification.processor';
import { SystemNotificationProcessor } from './processors/system-notification.processor';
import { PrismaModule } from '../prisma/prisma.module';
import { DevicesModule } from '../devices/devices.module';
import { EmailModule } from '../email/email.module';
import { WebPushService } from '../notifications/web-push.service';
import { NotificationTemplateService } from '../notifications/notification-template.service';
import { EnhancedNotificationService } from '../notifications/enhanced-notification.service';

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379');

console.log('🔧 QueueModule: Redis connection config');
console.log('Redis Host:', redisHost);
console.log('Redis Port:', redisPort);

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: redisHost,
        port: redisPort,
      },
    }),
    BullModule.registerQueue({
      name: 'trip-notifications',
    }),
    BullModule.registerQueue({
      name: 'expense-notifications',
    }),
    BullModule.registerQueue({
      name: 'payment-notifications',
    }),
    BullModule.registerQueue({
      name: 'system-notifications',
    }),
    PrismaModule,
    DevicesModule,
    EmailModule,
  ],
  controllers: [QueueController],
  providers: [
    QueueService, 
    BullMQBoardService,
    TripNotificationProcessor,
    ExpenseNotificationProcessor,
    PaymentNotificationProcessor,
    SystemNotificationProcessor,
    WebPushService,
    NotificationTemplateService,
    EnhancedNotificationService
  ],
  exports: [QueueService, BullMQBoardService],
})
export class QueueModule {}
