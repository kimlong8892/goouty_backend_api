import { Controller, Get, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { I18nService } from 'nestjs-i18n';
import { Lang } from '../decorators/i18n.decorator';

@ApiTags('I18n Demo')
@Controller('i18n-demo')
export class I18nDemoController {
    constructor(private readonly i18n: I18nService) { }

    @Get('hello')
    @ApiOperation({ summary: 'Test i18n with simple message' })
    @ApiResponse({ status: 200, description: 'Returns translated message' })
    async hello(@Lang() lang: string) {
        return {
            message: await this.i18n.translate('common.success', { lang }),
            currentLanguage: lang,
            info: 'Send Accept-Language header (vi or en) to change language',
        };
    }

    @Get('auth-messages')
    @ApiOperation({ summary: 'Get all auth messages in current language' })
    async getAuthMessages(@Lang() lang: string) {
        return {
            currentLanguage: lang,
            messages: {
                loginSuccess: await this.i18n.translate('auth.login.success', { lang }),
                loginFailed: await this.i18n.translate('auth.login.failed', { lang }),
                invalidCredentials: await this.i18n.translate('auth.login.invalidCredentials', { lang }),
                registerSuccess: await this.i18n.translate('auth.register.success', { lang }),
                emailExists: await this.i18n.translate('auth.register.emailExists', { lang }),
            },
        };
    }

    @Get('trip-messages')
    @ApiOperation({ summary: 'Get all trip messages in current language' })
    async getTripMessages(@Lang() lang: string) {
        return {
            currentLanguage: lang,
            messages: {
                tripCreated: await this.i18n.translate('trips.trip.created', { lang }),
                tripUpdated: await this.i18n.translate('trips.trip.updated', { lang }),
                tripDeleted: await this.i18n.translate('trips.trip.deleted', { lang }),
                tripNotFound: await this.i18n.translate('trips.trip.notFound', { lang }),
            },
        };
    }

    @Post('validate')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Test validation messages with parameters' })
    async validateWithParams(
        @Body() body: { field: string; min?: number; max?: number },
        @Lang() lang: string,
    ) {
        const messages = [];

        // Test required validation
        messages.push({
            type: 'required',
            message: await this.i18n.translate('common.validation.required', {
                lang,
                args: { field: body.field },
            }),
        });

        // Test min validation
        if (body.min) {
            messages.push({
                type: 'min',
                message: await this.i18n.translate('common.validation.min', {
                    lang,
                    args: { field: body.field, min: body.min },
                }),
            });
        }

        // Test max validation
        if (body.max) {
            messages.push({
                type: 'max',
                message: await this.i18n.translate('common.validation.max', {
                    lang,
                    args: { field: body.field, max: body.max },
                }),
            });
        }

        return {
            currentLanguage: lang,
            validationMessages: messages,
        };
    }

    @Get('all-languages')
    @ApiOperation({ summary: 'Get same message in all supported languages' })
    async getAllLanguages() {
        const message = 'common.success';

        return {
            key: message,
            translations: {
                vi: await this.i18n.translate(message, { lang: 'vi' }),
                en: await this.i18n.translate(message, { lang: 'en' }),
            },
            default: await this.i18n.translate(message), // Will use Vietnamese as default
        };
    }
}
