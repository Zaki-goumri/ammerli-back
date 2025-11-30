import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { FastifyReply } from 'fastify';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { AlertingService } from 'src/monitoring/alerting/interfaces/alerting.interface';

@Catch(HttpException, ThrottlerException)
export class HttpExceptionFilter implements ExceptionFilter {
  logger = new Logger(HttpExceptionFilter.name);

  constructor(
    private readonly i18n: I18nService,
    @Inject('AlertingService')
    private readonly alertingService: AlertingService,
  ) {}

  async catch(
    exception: HttpException | ThrottlerException,
    host: ArgumentsHost,
  ) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const status = exception.getStatus();
    const i18nContext = I18nContext.current(host);

    let message: string;
    let logMessage: string;

    if (exception instanceof ThrottlerException) {
      const key = exception.message;
      message = await this.i18n.t(key, { lang: i18nContext?.lang });
      logMessage = await this.i18n.t(key, { lang: 'en' });
    } else {
      const exceptionResponse = exception.getResponse();
      if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null &&
        'key' in exceptionResponse &&
        typeof (exceptionResponse as any).key === 'string'
      ) {
        const { key, args } = exceptionResponse as {
          key: string;
          args: Record<string, any>;
        };
        message = await this.i18n.t(key, {
          lang: i18nContext?.lang,
          args,
        });
        logMessage = await this.i18n.t(key, { lang: 'en', args });
      } else {
        const rawMessage =
          typeof exceptionResponse === 'string'
            ? exceptionResponse
            : (exceptionResponse as any)?.message;

        const messageContent = Array.isArray(rawMessage)
          ? rawMessage.join(', ')
          : rawMessage;

        message =
          messageContent ||
          (await this.i18n.t('http.internalServerError', {
            lang: i18nContext?.lang,
          }));
        logMessage = message;
      }
    }

    this.logger.warn(
      `HTTP Exception: Status ${status} - Message: ${logMessage}`,
    );
    if (exception.cause) {
      this.logger.error(exception.cause);
    }

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
        this.alertingService.sendAlert(`HTTP 500 Error: ${logMessage}`);
    }

    response.status(status).send({ // Use send for Fastify
      statusCode: status,
      message: message,
      success: false,
      timestamp: new Date().toISOString(),
    });
  }
}

