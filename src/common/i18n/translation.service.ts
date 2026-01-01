import { Injectable } from '@nestjs/common';
import { I18nContext, I18nService } from 'nestjs-i18n';

@Injectable()
export class TranslationService {
    constructor(private readonly i18n: I18nService) { }

    /**
     * Translate a key with optional arguments
     * @param key Translation key (e.g., 'auth.login.success')
     * @param args Optional arguments for interpolation
     * @param lang Optional language override
     */
    translate(key: string, args?: any, lang?: string): string {
        const currentLang = lang || I18nContext.current()?.lang || 'vi';
        return this.i18n.translate(key, { lang: currentLang, args });
    }

    /**
     * Get current language from context
     */
    getCurrentLanguage(): string {
        return I18nContext.current()?.lang || 'vi';
    }

    /**
     * Translate with current context
     * @param key Translation key
     * @param args Optional arguments
     */
    t(key: string, args?: any): string {
        return this.translate(key, args);
    }
}
