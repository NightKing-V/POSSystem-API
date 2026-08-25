import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest();
    const response = httpContext.getResponse();
    
    if (!request) {
      return next.handle();
    }

    const { method, url, body, query, params } = request;
    const now = Date.now();

    // Sanitize sensitive fields in request body
    const sanitizedBody = this.sanitizeBody(body);

    this.logger.log(
      `Incoming: [${method}] ${url} | Query: ${JSON.stringify(query)} | Params: ${JSON.stringify(params)} | Body: ${JSON.stringify(sanitizedBody)}`,
    );

    return next.handle().pipe(
      tap({
        next: (data) => {
          const delay = Date.now() - now;
          const statusCode = response.statusCode;
          this.logger.log(
            `Outgoing: [${method}] ${url} | Status: ${statusCode} | Delay: ${delay}ms`,
          );
          if (data) {
            this.logger.debug(
              `Response payload for [${method}] ${url}: ${JSON.stringify(data)}`,
            );
          }
        },
        error: (error) => {
          const delay = Date.now() - now;
          const statusCode = error.status || error.statusCode || 500;
          this.logger.error(
            `Error: [${method}] ${url} | Status: ${statusCode} | Delay: ${delay}ms | Message: ${error.message}`,
            error.stack,
          );
        },
      }),
    );
  }

  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }
    const sanitized = { ...body };
    const sensitiveKeys = ['password', 'passwordConfirm', 'token', 'accessToken', 'refreshToken'];
    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.includes(key)) {
        sanitized[key] = '********';
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = this.sanitizeBody(sanitized[key]);
      }
    }
    return sanitized;
  }
}
