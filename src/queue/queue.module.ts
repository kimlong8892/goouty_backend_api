import { Module, ModuleMetadata, Provider } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QueueService } from './queue.service';
import { QueueService as MockQueueService } from './mock-queue.service';
import { QueueController } from './queue.controller';
import { BullMQBoardService } from './bullmq-board.service';
import { BullMQBoardService as MockBullMQBoardService } from './mock-bullmq-board.service';
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
const isRedisDisabled = process.env.DISABLE_REDIS === 'true';

console.log('🔧 QueueModule: Configuration');
console.log('Redis Disabled:', isRedisDisabled);
if (!isRedisDisabled) {
  console.log('Redis Host:', redisHost);
  console.log('Redis Port:', redisPort);
}

const imports: ModuleMetadata['imports'] = [
  PrismaModule,
  DevicesModule,
  EmailModule,
];

const providers: Provider[] = [
  WebPushService,
  NotificationTemplateService,
  EnhancedNotificationService
];

if (!isRedisDisabled) {
  imports.push(
    BullModule.forRoot({
      connection: {
        host: redisHost,
        port: redisPort,
      },
    }),
    BullModule.registerQueue({ name: 'trip-notifications' }),
    BullModule.registerQueue({ name: 'expense-notifications' }),
    BullModule.registerQueue({ name: 'payment-notifications' }),
    BullModule.registerQueue({ name: 'system-notifications' }),
  );

  providers.push(
    { provide: QueueService, useClass: QueueService },
    { provide: BullMQBoardService, useClass: BullMQBoardService },
    TripNotificationProcessor,
    ExpenseNotificationProcessor,
    PaymentNotificationProcessor,
    SystemNotificationProcessor,
  );
} else {
  providers.push(
    { provide: QueueService, useClass: MockQueueService },
    { provide: BullMQBoardService, useClass: MockBullMQBoardService },
  );
}

@Module({
  imports: imports,
  controllers: isRedisDisabled ? [] : [QueueController],
  providers: providers,
  exports: [QueueService, BullMQBoardService],
})
export class QueueModule { }
