import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { TripsModule } from './trips/trips.module';
import { DaysModule } from './days/days.module';
import { ActivitiesModule } from './activities/activities.module';
import { ExpensesModule } from './expenses/expenses.module';
import { UsersModule } from "./users/users.module";
import { AuthModule } from "./auth/auth.module";
import { EmailModule } from './email/email.module';
import { NotificationModule } from './notifications/notification.module';
import { DevicesModule } from './devices/devices.module';
import { QueueModule } from './queue/queue.module';
import { ProvincesModule } from './provinces/provinces.module';
import { TripTemplatesModule } from './trip-templates/trip-templates.module';
import { UploadModule } from './upload/upload.module';
import { TelegramModule } from './common/telegram/telegram.module';
import { SeedModule } from './seed/seed.module';
import * as Joi from 'joi';
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { LoggerModule } from 'nestjs-pino';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { I18nModule, AcceptLanguageResolver, QueryResolver, HeaderResolver } from 'nestjs-i18n';
import * as path from 'path';
import { I18nHelperModule } from './common/i18n/i18n-helper.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: true,
      validationSchema: Joi.object({
        JWT_SECRET: Joi.string().min(10).required(),
        JWT_EXPIRES_IN: Joi.string().default('1h'),
        NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
        REDIS_HOST: Joi.string().default('localhost'),
        REDIS_PORT: Joi.number().default(6379),
        BULLMQ_REMOVE_ON_COMPLETE: Joi.alternatives().try(
          Joi.string().valid('false'),
          Joi.number().min(0)
        ).default('false'),
        BULLMQ_REMOVE_ON_FAIL: Joi.alternatives().try(
          Joi.string().valid('false'),
          Joi.number().min(0)
        ).default('false'),
        BULLMQ_UI_USERNAME: Joi.string().default('admin'),
        BULLMQ_UI_PASSWORD: Joi.string().min(6).default('admin123'),
        // S3 Configuration (CloudFly)
        S3_ACCESS_KEY_ID: Joi.string().required(),
        S3_SECRET_ACCESS_KEY: Joi.string().required(),
        S3_REGION: Joi.string().default('us-east-1'),
        S3_ENDPOINT: Joi.string().default('https://s3.cloudfly.vn'),
        S3_BUCKET: Joi.string().default('goouty'),
        S3_FORCE_PATH_STYLE: Joi.string().valid('true', 'false').default('true'),
        TELEGRAM_BOT_TOKEN: Joi.string().optional(),
        TELEGRAM_CHAT_ID: Joi.string().optional(),
        VITE_APP_URL: Joi.string().uri().optional(),
        APP_URL: Joi.string().uri().optional(),
        USE_CLOUD_TASKS: Joi.string().valid('true', 'false').default('false'),
        GCP_PROJECT_ID: Joi.string().optional(),
        GCP_LOCATION: Joi.string().default('asia-southeast1'),
        GCP_SERVICE_ACCOUNT_EMAIL: Joi.string().email().optional(),
        QUEUE_TRIP: Joi.string().default('trip-notifications'),
        QUEUE_EXPENSE: Joi.string().default('expense-notifications'),
        QUEUE_PAYMENT: Joi.string().default('payment-notifications'),
        QUEUE_SYSTEM: Joi.string().default('system-notifications'),
      }),
    }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        return {
          pinoHttp: {
            transport: {
              target: 'pino-pretty',
              options: {
                singleLine: true,
              },
            },
            // Cấu hình log request để lọc thông tin nhạy cảm
            serializers: {
              req(req) {
                req.headers.authorization = '[Filtered]';
                return req;
              },
            },
            autoLogging: true,
          },
        };
      },
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'vi',
      loaderOptions: {
        path: path.join(__dirname, 'i18n'),
        watch: true,
      },
      resolvers: [
        new QueryResolver(['lang', 'l']),
        new HeaderResolver(['x-custom-lang']),
      ],
    }),
    PrismaModule,
    TripsModule,
    DaysModule,
    ActivitiesModule,
    ExpensesModule,
    UsersModule,
    AuthModule,
    EmailModule,
    NotificationModule,
    DevicesModule,
    QueueModule,
    ProvincesModule,
    TripTemplatesModule,
    UploadModule,
    TelegramModule,
    I18nHelperModule,
    SeedModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule { }