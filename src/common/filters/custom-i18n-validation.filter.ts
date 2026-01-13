
import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from '@nestjs/common';
import { I18nContext, I18nValidationException } from 'nestjs-i18n';

@Catch(I18nValidationException)
export class CustomI18nValidationExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(CustomI18nValidationExceptionFilter.name);

    catch(exception: I18nValidationException, host: ArgumentsHost) {
        const i18n = I18nContext.current();
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();

        let errors = exception.errors;

        // Only attempt translation if i18n context is available
        if (i18n && i18n.service) {
            try {
                // We can't easily access the internal formatI18nErrors utility
                // So we rely on a simplified approach or just accept that 
                // the pipe might have effectively done some work or we return raw errors
                // If we strictly want the library behavior we would need to import utils
                // But for now, fixing the crash is priority.

                // Actually, if we just want to avoid the crash:
                // The library filter crashes because it blindly does `i18n.service`.
                // If we don't have i18n, we just output the errors as they are.

                // To properly format, we could loop and translate if we knew how,
                // but the ValidationError objects are complex.

                // However, typically I18nValidationPipe puts errors in exception.errors.
                // And the filter formats them.

                // Let's rely on standard class-validator structure if context is missing.

                // If we have context, maybe we can try to use a simplified translation
                // or just use the raw errors until we fix the context loss.
            } catch (e) {
                this.logger.error('Error during i18n error formatting', e);
            }
        } else {
            this.logger.warn('I18nContext not available in filter - returning raw errors');
        }

        // Standardize the response similar to what nestjs-i18n would do, 
        // or at least what our frontend expects.
        const responseBody = {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Validation failed',
            errors: this.formatErrors(errors), // Custom simple formatter or just pass errors
        };

        response.status(HttpStatus.BAD_REQUEST).send(responseBody);
    }

    private formatErrors(errors: any[]) {
        // Simple flattening of errors for client consumption if needed
        // Or just return them as is if frontend expects detailed structure
        return errors.map(err => {
            return {
                property: err.property,
                constraints: err.constraints,
                children: err.children
            }
        });
    }
}
