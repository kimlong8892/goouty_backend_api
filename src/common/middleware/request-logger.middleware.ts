import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
    private readonly logger = new Logger('RequestLogger');

    use(req: Request, res: Response, next: NextFunction) {
        const { method, originalUrl, headers } = req;

        // All requests are logged in pino-http, adding extra logging here if needed in future.

        next();
    }
}
