import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class TelegramService {
    private readonly logger = new Logger(TelegramService.name);
    private readonly botToken: string;
    private readonly chatId: string;
    private readonly env: string;

    constructor(private configService: ConfigService) {
        this.botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
        this.chatId = this.configService.get<string>('TELEGRAM_CHAT_ID');
        this.env = this.configService.get<string>('NODE_ENV', 'development');
    }

    async sendMessage(message: string) {
        if (!this.botToken || !this.chatId) {
            this.logger.warn('Telegram Bot Token or Chat ID not configured. Skipping notification.');
            return;
        }

        const formattedMessage = `<b>[${this.env.toUpperCase()}] GOOUTY ALERT</b>\n\n${message}`;

        try {
            await axios.post(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
                chat_id: this.chatId,
                text: formattedMessage,
                parse_mode: 'HTML',
            });
        } catch (error) {
            this.logger.error(`Failed to send Telegram notification: ${error.message}`);
        }
    }
}
