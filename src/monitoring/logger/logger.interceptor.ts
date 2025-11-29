import {
  CallHandler,
  ExecutionContext,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { Observable, tap } from 'rxjs';

export class LoggerInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggerInterceptor.name);

  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> {
    const startTime = Date.now();
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const response = context.switchToHttp().getResponse<FastifyReply>();

    const { method, url, ip } = request; // Use url directly for Fastify
    const userAgent = request.headers['user-agent'] || ''; // Changed for Fastify
    const traceId =
      (request.headers['x-request-id'] as string) ||
      `trace-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Log Request
    this.logger.log({
      message: `Incoming Request: ${method} ${url}`, // Use url for Fastify
      context: 'HTTP',
      traceId,
      method,
      url,
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
            message: `Request Completed: ${method} ${url} ${statusCode}`, // Use url for Fastify
            context: 'HTTP',
            traceId,
            method,
            url,
            statusCode,
            duration_ms: duration,
          });
        },
        error: (error) => {
          const endTime = Date.now();
          const duration = endTime - startTime;

          this.logger.error({
            message: `Request Failed: ${method} ${url}`, // Use url for Fastify
            context: 'HTTP',
            traceId,
            method,
            url,
            duration_ms: duration,
            error: error.message,
            stack: error.stack,
          });
        },
      }),
    );
  }
}
