import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

function extractIp(request: Request): string {
  const forwarded = request.headers['x-forwarded-for'];
  const raw =
    typeof forwarded === 'string'
      ? (forwarded.split(',')[0] ?? '').trim()
      : request.socket.remoteAddress || 'unknown';
  return raw.replace(/^::ffff:/, '');
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url } = request;
    const requestId = request.requestId || 'unknown';
    const ip = extractIp(request);
    const start = Date.now();

    this.logger.log(
      JSON.stringify({
        event: 'incoming_request',
        requestId,
        method,
        path: url,
        ip,
      }),
    );

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        this.logger.log(
          JSON.stringify({
            event: 'end_request',
            requestId,
            method,
            path: url,
            ip,
            duration: `${duration}ms`,
          }),
        );
      }),
    );
  }
}
