import {
  CallHandler,
  ExecutionContext,
  Logger,
  NestInterceptor,
  Injectable,
} from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { ClsService } from 'nestjs-cls';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  constructor(private readonly clsService: ClsService) {}

  private readonly logger = new Logger(LoggerInterceptor.name);

  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> {
    const startTime = Date.now();
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const response = context.switchToHttp().getResponse<FastifyReply>();

    const { method, url, ip } = request;
    const userAgent = request.headers['user-agent'] || '';
    const body = this.extractBody(request);
    const traceId = this.clsService.get<string>('requestId');

    this.logger.log({
      message: `Incoming Request: ${method} ${url}`,
      context: 'HTTP',
      body,
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
            message: `Request Completed: ${method} ${url} ${statusCode}`,
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
            message: `Request Failed: ${method} ${url}`,
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

  private extractBody(request: FastifyRequest): Record<string, any> | string {
    const contentType = request.headers['content-type'] || '';

    // Regular JSON body
    if (contentType.includes('application/json')) {
      return request.body as Record<string, any>;
    }

    // Form data / multipart
    if (
      contentType.includes('multipart/form-data') ||
      contentType.includes('application/x-www-form-urlencoded')
    ) {
      const body = request.body as Record<string, any>;
      if (!body) return {};

      // Iterate fields, replace file buffers with metadata
      return Object.entries(body).reduce(
        (acc, [key, value]) => {
          if (value && typeof value === 'object' && 'filename' in value) {
            // It's a file field — log metadata only, never the buffer
            acc[key] = {
              filename: (value as any).filename,
              mimetype: (value as any).mimetype,
              encoding: (value as any).encoding,
              size: (value as any)?.data?.length ?? 'unknown',
            };
          } else {
            acc[key] = value;
          }
          return acc;
        },
        {} as Record<string, any>,
      );
    }

    return '[unsupported content-type]';
  }
}
