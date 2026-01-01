import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { I18nContext } from 'nestjs-i18n';

/**
 * Decorator to get current language from request
 * Usage: @Lang() lang: string
 */
export const Lang = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): string => {
        const i18n = I18nContext.current(ctx);
        return i18n?.lang || 'vi';
    },
);

/**
 * Decorator to get I18n context
 * Usage: @I18n() i18n: I18nContext
 */
export const I18n = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        return I18nContext.current(ctx);
    },
);
