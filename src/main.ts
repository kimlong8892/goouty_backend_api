import { NestFactory } from '@nestjs/core';
import { RequestMethod } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { BullMQBoardService } from './queue/bullmq-board.service';
import { BullMQAuthMiddleware } from './queue/bullmq-auth.middleware';
import { HttpAdapterHost } from '@nestjs/core';
import { TelegramService } from './common/telegram/telegram.service';
import { I18nValidationPipe, I18nValidationExceptionFilter } from 'nestjs-i18n';

import { Logger } from 'nestjs-pino';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule, { cors: true, bufferLogs: true });
    app.useLogger(app.get(Logger));

    app.setGlobalPrefix('api', {
      exclude: [{ path: '/', method: RequestMethod.GET }],
    });

    // Global validation pipe with i18n support
    app.useGlobalPipes(
      new I18nValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    // Global exception filter for i18n validation errors
    app.useGlobalFilters(new I18nValidationExceptionFilter());

    // Global exception filter is now registered in AppModule


    // Setup BullMQ Board UI với authentication
    const bullMQBoardService = app.get(BullMQBoardService);
    const bullMQAuthMiddleware = new BullMQAuthMiddleware();

    // Áp dụng basic auth middleware cho BullMQ UI
    app.use('/admin/queues', bullMQAuthMiddleware.use.bind(bullMQAuthMiddleware));
    app.use('/admin/queues', bullMQBoardService.getServerAdapter().getRouter());

    // Swagger API documentation
    const config = new DocumentBuilder()
      .setTitle('Goouty API')
      .setDescription('API for Goouty travel application')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config, {
      operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
    });

    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        requestInterceptor: (req) => {
          if (req.url.includes('/images')) {
            req.headers['Content-Type'] = 'multipart/form-data';
          }
          return req;
        },
      },
    });

    // Start the server
    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`Application is running on: http://localhost:${port}`);
    console.log(`API documentation available at: http://localhost:${port}/api`);
    console.log(`BullMQ UI available at: http://localhost:${port}/admin/queues`);
  } catch (error) {
    console.error('❌ Application failed to start:', error);
    process.exit(1);
  }
}

bootstrap();