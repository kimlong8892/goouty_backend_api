import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { TelegramService } from '../telegram/telegram.service';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    constructor(
        private readonly httpAdapterHost: HttpAdapterHost,
        private readonly telegramService: TelegramService,
        @InjectPinoLogger(AllExceptionsFilter.name) private readonly logger: PinoLogger
    ) { }

    catch(exception: unknown, host: ArgumentsHost): void {
        const { httpAdapter } = this.httpAdapterHost;
        const ctx = host.switchToHttp();

        const httpStatus =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        const request = ctx.getRequest();
        const url = httpAdapter.getRequestUrl(request);
        const method = httpAdapter.getRequestMethod(request);

        // Extract error message and validation errors
        let errorMessage = 'Unknown error';
        let validationErrors = null;

        if (exception instanceof HttpException) {
            const response = exception.getResponse();
            if (typeof response === 'object' && response !== null) {
                errorMessage = (response as any).message || exception.message;
                // Handle validation errors from class-validator
                if (Array.isArray((response as any).message)) {
                    validationErrors = (response as any).message;
                    errorMessage = 'Validation failed';
                }
            } else {
                errorMessage = exception.message;
            }
        } else if (exception instanceof Error) {
            errorMessage = exception.message;
        }

        const responseBody: any = {
            statusCode: httpStatus,
            timestamp: new Date().toISOString(),
            path: url,
            message: errorMessage,
        };

        // Add validation errors if present
        if (validationErrors) {
            responseBody.errors = validationErrors;
        }

        // Chuẩn bị dữ liệu lỗi
        const stack = exception instanceof Error ? exception.stack : '';

        // Luôn ghi log ra Console (Dozzle) cho mọi lỗi
        if (httpStatus >= 500) {
            this.logger.error({
                msg: `Server Error: ${errorMessage}`,
                method,
                url,
                status: httpStatus,
                error: errorMessage,
                stack: stack,
            });
        } else {
            this.logger.warn({
                msg: `Client Error: ${errorMessage}`,
                method,
                url,
                status: httpStatus,
                error: errorMessage,
            });
        }

        // Gửi thông báo tới Telegram nếu là lỗi hệ thống (>= 500)
        if (httpStatus >= 500) {
            const telegramMsg =
                `❌ <b>Server Error (${httpStatus})</b>\n` +
                `<b>Method:</b> ${method}\n` +
                `<b>URL:</b> ${url}\n` +
                `<b>Error:</b> ${errorMessage}\n` +
                `<code>${stack?.substring(0, 500)}...</code>`;

            this.telegramService.sendMessage(telegramMsg);
        }

        httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
    }
}
