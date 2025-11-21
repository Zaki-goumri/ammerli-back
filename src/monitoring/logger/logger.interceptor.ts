import {
  CallHandler,
  ExecutionContext,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';

export class LoggerInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggerInterceptor.name);

  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> {
    const startTime = Date.now();
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const { method, originalUrl, ip } = request;
    const userAgent = request.get('user-agent') || '';
    const traceId =
      (request.headers['x-request-id'] as string) ||
      `trace-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Log Request
    this.logger.log({
      message: `Incoming Request: ${method} ${originalUrl}`,
      context: 'HTTP',
      traceId,
      method,
      url: originalUrl,
      ip,
      userAgent,
    });

    return next.handle().pipe(
      tap({
        next: () => {
          const endTime = Date.now();
          const duration = endTime - startTime;
          const statusCode = response.statusCode;

          this.logger.log({
            message: `Request Completed: ${method} ${originalUrl} ${statusCode}`,
            context: 'HTTP',
            traceId,
            method,
            url: originalUrl,
            statusCode,
            duration_ms: duration,
          });
        },
        error: (error) => {
          const endTime = Date.now();
          const duration = endTime - startTime;

          this.logger.error({
            message: `Request Failed: ${method} ${originalUrl}`,
            context: 'HTTP',
            traceId,
            method,
            url: originalUrl,
            duration_ms: duration,
            error: error.message,
            stack: error.stack,
          });
        },
      }),
    );
  }
}
