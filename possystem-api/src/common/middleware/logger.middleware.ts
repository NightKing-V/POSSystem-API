import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl } = req;
    const startTime = Date.now();

    this.logger.log(`Incoming: [${method}] ${originalUrl}`);

    res.on('finish', () => {
      const delay = Date.now() - startTime;
      const statusCode = res.statusCode;
      const logMessage = `Outgoing: [${method}] ${originalUrl} | Status: ${statusCode} | Delay: ${delay}ms`;

      if (statusCode >= 400) {
        this.logger.warn(logMessage);
      } else {
        this.logger.log(logMessage);
      }
    });

    next();
  }
}

