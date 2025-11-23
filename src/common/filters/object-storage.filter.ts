import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { I18nService } from 'nestjs-i18n';

interface MinioError extends Error {
  code?: string;
}

@Catch()
export class ObjectStorageExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ObjectStorageExceptionFilter.name);

  constructor(private readonly i18n: I18nService) {}

  catch(exception: MinioError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = this.i18n.t('object-storage.default.message');
    let error = this.i18n.t('object-storage.default.error');

    switch (exception.code) {
      case 'NoSuchBucket':
        status = HttpStatus.NOT_FOUND;
        message = this.i18n.t('object-storage.noSuchBucket.message');
        error = this.i18n.t('object-storage.noSuchBucket.error');
        break;
      case 'NoSuchKey':
        status = HttpStatus.NOT_FOUND;
        message = this.i18n.t('object-storage.noSuchKey.message');
        error = this.i18n.t('object-storage.noSuchKey.error');
        break;
      case 'AccessDenied':
        status = HttpStatus.FORBIDDEN;
        message = this.i18n.t('object-storage.accessDenied.message');
        error = this.i18n.t('object-storage.accessDenied.error');
        break;
      case 'InternalError':
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = this.i18n.t('object-storage.internalError.message');
        error = this.i18n.t('object-storage.internalError.error');
        break;
    }

    this.logger.error(
      `Object Storage Error: ${exception.message}`,
      exception.stack,
    );

    response.status(status).json({
      statusCode: status,
      message: message,
      error: error,
      timestamp: new Date().toISOString(),
    });
  }
}
