import { Module, ModuleMetadata, Provider } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QueueService } from './queue.service';
import { QueueService as MockQueueService } from './mock-queue.service';
import { QueueController } from './queue.controller';
import { BullMQBoardService } from './bullmq-board.service';
import { BullMQBoardService as MockBullMQBoardService } from './mock-bullmq-board.service';
import { CloudTasksService } from './cloud-tasks.service';
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
const useCloudTasks = process.env.USE_CLOUD_TASKS === 'true' || !!process.env.GCP_PROJECT_ID;

console.log('🔧 QueueModule: Configuration');
console.log('Redis Disabled:', isRedisDisabled);
console.log('Use Cloud Tasks:', useCloudTasks);
if (!isRedisDisabled && !useCloudTasks) {
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

if (useCloudTasks) {
  console.log('🚀 QueueModule: Using Google Cloud Tasks');
  providers.push(
    { provide: QueueService, useClass: CloudTasksService },
    { provide: BullMQBoardService, useClass: MockBullMQBoardService },
  );
} else if (!isRedisDisabled) {
  console.log('🐂 QueueModule: Using BullMQ (Redis)');
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
  console.log('🧪 QueueModule: Using Mock Queue');
  providers.push(
    { provide: QueueService, useClass: MockQueueService },
    { provide: BullMQBoardService, useClass: MockBullMQBoardService },
  );
}

@Module({
  imports: imports,
  controllers: (isRedisDisabled && !useCloudTasks) ? [] : [QueueController],
  providers: providers,
  exports: [QueueService, BullMQBoardService],
})
export class QueueModule { }
