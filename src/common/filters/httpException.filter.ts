import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { I18nService } from 'nestjs-i18n';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  logger = new Logger(HttpExceptionFilter.name);

  constructor(private readonly i18n: I18nService) {}

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status = exception.getStatus();
    const message =
      exception.message || this.i18n.t('http.internalServerError');

    this.logger.warn(
      `HTTP Exception: Status ${status} - Message: ${exception.message}`,
    );
    this.logger.error(exception.cause);
    response.status(status).json({
      statusCode: status,
      message: message,
      success: false,
      timestamp: new Date().toISOString(),
    });
  }
}
