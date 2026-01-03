import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
    private readonly logger = new Logger('RequestLogger');

    use(req: Request, res: Response, next: NextFunction) {
        const { method, originalUrl, headers } = req;

        // Only log queue-related requests or all for debugging? Let's do all for now or specific
        if (originalUrl.includes('/queue/process')) {
            this.logger.log(`Incoming Request: ${method} ${originalUrl}`);
            this.logger.log(`Headers: ${JSON.stringify(headers)}`);
        }

        next();
    }
}
