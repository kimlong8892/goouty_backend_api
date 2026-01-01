import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as basicAuth from 'express-basic-auth';

@Injectable()
export class BullMQAuthMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const username = process.env.BULLMQ_UI_USERNAME || 'admin';
    const password = process.env.BULLMQ_UI_PASSWORD || 'admin123';

    const authMiddleware = basicAuth({
      users: { [username]: password },
      challenge: true,
      realm: 'Goouty Queue',
    });

    authMiddleware(req, res, next);
  }
}
