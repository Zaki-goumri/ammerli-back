import {
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { AlertingService } from 'src/monitoring/alerting/interfaces/alerting.interface';

@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  constructor(
    @Inject('AlertingService')
    private readonly alertingService: AlertingService,
  ) {
    super();
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.alertingService.sendAlert(
        `Internal Server Error on ${request.method} ${request.url}: ${
          (exception as Error).message
        }`,
      );
    }

    super.catch(exception, host);
  }
}
