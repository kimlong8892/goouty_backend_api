import { Module } from '@nestjs/common';
import { I18nDemoController } from './i18n-demo.controller';
import { TranslationService } from './translation.service';

@Module({
    controllers: [I18nDemoController],
    providers: [TranslationService],
    exports: [TranslationService],
})
export class I18nHelperModule { }
