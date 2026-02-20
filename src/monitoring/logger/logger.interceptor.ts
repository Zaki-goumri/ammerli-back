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

    const { method, url, ip, body } = request;
    const userAgent = request.headers['user-agent'] || '';
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
}
