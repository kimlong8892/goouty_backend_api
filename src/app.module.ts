import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { TripsModule } from './trips/trips.module';
import { DaysModule } from './days/days.module';
import { ActivitiesModule } from './activities/activities.module';
import { ExpensesModule } from './expenses/expenses.module';
import { UsersModule } from "./users/users.module";
import { AuthModule } from "./auth/auth.module";

import { NotificationModule } from './notifications/notification.module';
import { DevicesModule } from './devices/devices.module';
import { ProvincesModule } from './provinces/provinces.module';
import { TripTemplatesModule } from './trip-templates/trip-templates.module';
import { UploadModule } from './upload/upload.module';
import { TelegramModule } from './common/telegram/telegram.module';


import { LocationsModule } from './locations/locations.module';
import { RatingsModule } from './ratings/ratings.module';
import { AiModule } from './ai/ai.module';

import * as Joi from 'joi';
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { LoggerModule } from 'nestjs-pino';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { I18nModule, AcceptLanguageResolver, QueryResolver, HeaderResolver } from 'nestjs-i18n';
import * as path from 'path';
import { I18nHelperModule } from './common/i18n/i18n-helper.module';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'test', 'production').required(),
        PORT: Joi.number().optional(),

        // Database
        DATABASE_URL: Joi.string().required(),
        DB_USER: Joi.string().optional(),
        DB_HOST: Joi.string().optional(),
        DB_PORT: Joi.number().optional(),
        DB_NAME: Joi.string().optional(),
        DB_SCHEMA: Joi.string().optional(),

        // JWT
        JWT_SECRET: Joi.string().min(10).required(),
        JWT_EXPIRES_IN: Joi.string().required(),

        // S3 Configuration (CloudFly)
        S3_ACCESS_KEY_ID: Joi.string().required(),
        S3_SECRET_ACCESS_KEY: Joi.string().required(),
        S3_REGION: Joi.string().optional(),
        S3_ENDPOINT: Joi.string().optional(),
        S3_BUCKET: Joi.string().required(),
        S3_PUBLIC_URL: Joi.string().optional(),
        S3_FORCE_PATH_STYLE: Joi.string().valid('true', 'false').optional(),



        // Telegram
        TELEGRAM_BOT_TOKEN: Joi.string().optional(),
        TELEGRAM_CHAT_ID: Joi.string().optional(),

        // Google Auth
        GOOGLE_CLIENT_ID: Joi.string().optional(),
        GOOGLE_CLIENT_SECRET: Joi.string().optional(),

        // App URLs
        APP_URL: Joi.string().uri().optional(),
        APP_URL_API: Joi.string().uri().optional(),

        // Rate Limit
        THROTTLE_TTL: Joi.number().default(60),
        THROTTLE_LIMIT: Joi.number().default(100),

        // Goong API
        GOONG_API_KEY: Joi.string().optional(),

        // Gemini API
        GEMINI_API_KEY: Joi.string().optional(),


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
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get('THROTTLE_TTL'),
          limit: config.get('THROTTLE_LIMIT'),
        },
      ],
    }),
    PrismaModule,
    TripsModule,
    DaysModule,
    ActivitiesModule,
    ExpensesModule,
    UsersModule,
    AuthModule,

    NotificationModule,
    DevicesModule,
    ProvincesModule,
    TripTemplatesModule,
    UploadModule,
    TelegramModule,
    I18nHelperModule,

    LocationsModule,
    RatingsModule,
    AiModule,

  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestLoggerMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}