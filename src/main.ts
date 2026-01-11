import { NestFactory } from '@nestjs/core';
import { RequestMethod } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpAdapterHost } from '@nestjs/core';
import { TelegramService } from './common/telegram/telegram.service';
import { I18nValidationPipe, I18nValidationExceptionFilter } from 'nestjs-i18n';

import { Logger } from 'nestjs-pino';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule, { cors: true, bufferLogs: true });
    app.useLogger(app.get(Logger));

    // Enable trust proxy for rate limiting (needed if behind Nginx/Cloudflare)
    const expressApp = app.getHttpAdapter().getInstance();
    expressApp.set('trust proxy', 1);

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
    console.log(`Starting app on port: ${port} (env: ${process.env.PORT})`);
    await app.listen(port, '0.0.0.0');
    console.log(`Application is running on: http://localhost:${port}`);
    console.log(`API documentation available at: http://localhost:${port}/api`);
  } catch (error) {
    console.error('❌ Application failed to start:', error);
    process.exit(1);
  }
}

bootstrap();