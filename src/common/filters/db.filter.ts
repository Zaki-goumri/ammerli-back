import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError, EntityNotFoundError } from 'typeorm';
import { PostgresErrorCode, isPostgresError } from '../constants/db-code';

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
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorResult = this.handleException(exception);

    this.logError(exception, request, errorResult.status);

    const errorResponse = {
      statusCode: errorResult.status,
      timestamp: new Date().toISOString(),
      error: errorResult.error,
      message: errorResult.message,
    };

    response.status(errorResult.status).json(errorResponse);
  }

  private handleException(
    exception: QueryFailedError | EntityNotFoundError,
  ): DatabaseErrorResult {
    if (this.isEntityNotFoundError(exception)) {
      return {
        status: HttpStatus.NOT_FOUND,
        message: 'Resource not found',
        error: 'Not Found',
      };
    }

    if (this.isQuertFailedError(exception)) {
      return this.handleQueryFailedError(exception);
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Database error occurred',
      error: 'Internal Server Error',
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
            error: 'Conflict',
          };

        case PostgresErrorCode.FOREIGN_KEY_VIOLATION:
          return {
            status: HttpStatus.BAD_REQUEST,
            message: 'Referenced resource does not exist',
            error: 'Bad Request',
          };

        case PostgresErrorCode.NOT_NULL_VIOLATION:
          return {
            status: HttpStatus.BAD_REQUEST,
            message: this.extractNotNullViolationMessage(driverError),
            error: 'Bad Request',
          };

        case PostgresErrorCode.CHECK_VIOLATION:
          return {
            status: HttpStatus.BAD_REQUEST,
            message: 'Data validation failed',
            error: 'Bad Request',
          };

        case PostgresErrorCode.EXCLUSION_VIOLATION:
          return {
            status: HttpStatus.CONFLICT,
            message: 'Data conflict detected',
            error: 'Conflict',
          };

        default:
          return {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            message: 'Database error occurred',
            error: 'Internal Server Error',
          };
      }
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Database error occurred',
      error: 'Internal Server Error',
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
    request: Request,
    statusCode: number,
  ): void {
    const base = `${request.method} ${request.url} - ${statusCode}`;

    if (statusCode >= 500) {
      const stack = exception instanceof Error ? exception.stack : undefined;
      this.logger.error(base, stack);
    } else {
      const detail =
        exception instanceof Error ? exception.message : String(exception);
      this.logger.warn(`${base} - ${detail}`);
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
        return `${field} already exists`;
      }
    }

    return 'Resource already exists';
  }

  private extractNotNullViolationMessage(
    driverError: PostgresDriverError,
  ): string {
    const column = driverError?.column;

    if (column) {
      const fieldName = column.replace(/_/g, ' ');
      return `${fieldName} is required`;
    }

    return 'Required field is missing';
  }
}
