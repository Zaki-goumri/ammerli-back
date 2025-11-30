import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
  Inject,
} from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { QueryFailedError, EntityNotFoundError } from 'typeorm';
import { PostgresErrorCode, isPostgresError } from '../constants/db-code';
import { I18nService } from 'nestjs-i18n';
import { AlertingService } from 'src/monitoring/alerting/interfaces/alerting.interface';

interface PostgresDriverError {
  code?: string;
  detail?: string;
  column?: string;
  constraint?: string;
}

interface DatabaseErrorResult {
  status: number;
  message: string;
  error: string;
}

@Catch(QueryFailedError, EntityNotFoundError)
export class DatabaseExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DatabaseExceptionFilter.name);

  constructor(
    private readonly i18n: I18nService,
    @Inject('AlertingService')
    private readonly alertingService: AlertingService,
  ) {}

  catch(
    exception: QueryFailedError | EntityNotFoundError,
    host: ArgumentsHost,
  ): void {
    /*
 * commented in dev for now
    if (host.getType() !== 'http') {
      return;
    }
*/
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    const errorResult = this.handleException(exception);

    this.logError(exception, request, errorResult.status);

    if (errorResult.status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.alertingService.sendAlert(
        `Database Error: ${errorResult.error} - ${errorResult.message}`,
      );
    }

    const errorResponse = {
      statusCode: errorResult.status,
      timestamp: new Date().toISOString(),
      error: errorResult.error,
      message: errorResult.message,
    };

    response.status(errorResult.status).send(errorResponse); // Use send for Fastify
  }

  private handleException(
    exception: QueryFailedError | EntityNotFoundError,
  ): DatabaseErrorResult {
    if (this.isEntityNotFoundError(exception)) {
      return {
        status: HttpStatus.NOT_FOUND,
        message: this.i18n.t('db.resourceNotFound.message'),
        error: this.i18n.t('db.resourceNotFound.error'),
      };
    }

    if (this.isQuertFailedError(exception)) {
      return this.handleQueryFailedError(exception);
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: this.i18n.t('db.databaseError.message'),
      error: this.i18n.t('db.databaseError.error'),
    };
  }

  private isEntityNotFoundError(
    exception: unknown,
  ): exception is EntityNotFoundError {
    return exception instanceof EntityNotFoundError;
  }

  private isQuertFailedError(
    exception: unknown,
  ): exception is QueryFailedError {
    return exception instanceof QueryFailedError;
  }

  private handleQueryFailedError(error: QueryFailedError): DatabaseErrorResult {
    const driverError = this.extractDriverError(error);

    if (driverError?.code && isPostgresError(driverError as unknown)) {
      switch (driverError.code) {
        case PostgresErrorCode.UNIQUE_VIOLATION:
          return {
            status: HttpStatus.CONFLICT,
            message: this.extractUniqueViolationMessage(driverError),
            error: this.i18n.t('db.uniqueViolation.error'),
          };

        case PostgresErrorCode.FOREIGN_KEY_VIOLATION:
          return {
            status: HttpStatus.BAD_REQUEST,
            message: this.i18n.t('db.foreignKeyViolation.message'),
            error: this.i18n.t('db.foreignKeyViolation.error'),
          };

        case PostgresErrorCode.NOT_NULL_VIOLATION:
          return {
            status: HttpStatus.BAD_REQUEST,
            message: this.extractNotNullViolationMessage(driverError),
            error: this.i18n.t('db.notNullViolation.error'),
          };

        case PostgresErrorCode.CHECK_VIOLATION:
          return {
            status: HttpStatus.BAD_REQUEST,
            message: this.i18n.t('db.checkViolation.message'),
            error: this.i18n.t('db.checkViolation.error'),
          };

        case PostgresErrorCode.EXCLUSION_VIOLATION:
          return {
            status: HttpStatus.CONFLICT,
            message: this.i18n.t('db.exclusionViolation.message'),
            error: this.i18n.t('db.exclusionViolation.error'),
          };

        default:
          return {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            message: this.i18n.t('db.databaseError.message'),
            error: this.i18n.t('db.databaseError.error'),
          };
      }
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: this.i18n.t('db.databaseError.message'),
      error: this.i18n.t('db.databaseError.error'),
    };
  }

  private extractDriverError(error: QueryFailedError): PostgresDriverError {
    /*eslint-disable-next-line*/
    return (error as any).driverError ?? (error as any);
  }

  private shouldIncludeStack(): boolean {
    return process.env.NODE_ENV !== 'production';
  }

  private logError(
    exception: QueryFailedError | EntityNotFoundError,
    request: FastifyRequest,
    statusCode: number,
  ): void {
    const { method, url } = request;

    if (statusCode >= 500) {
      this.logger.error({
        message: 'Database error',
        method,
        url,
        statusCode,
        error: exception.message,
        stack: exception instanceof Error ? exception.stack : undefined,
        context: 'DatabaseExceptionFilter',
      });
    } else {
      this.logger.warn({
        message: 'Database warning',
        method,
        url,
        statusCode,
        error: exception.message,
        context: 'DatabaseExceptionFilter',
      });
    }
  }

  private extractUniqueViolationMessage(
    driverError: PostgresDriverError,
  ): string {
    const detail = driverError?.detail;

    if (detail && typeof detail === 'string') {
      const match = detail.match(/Key \(([^)]+)\)=/);
      if (match && match[1]) {
        const field = match[1].replace(/_/g, ' ');
        return this.i18n.t('db.uniqueViolation.message', {
          args: { field },
        });
      }
    }

    return this.i18n.t('db.uniqueViolation.defaultMessage');
  }

  private extractNotNullViolationMessage(
    driverError: PostgresDriverError,
  ): string {
    const column = driverError?.column;

    if (column) {
      const fieldName = column.replace(/_/g, ' ');
      return this.i18n.t('db.notNullViolation.message', {
        args: { field: fieldName },
      });
    }

    return this.i18n.t('db.notNullViolation.defaultMessage');
  }
}
