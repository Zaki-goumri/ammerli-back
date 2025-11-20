import { LoggerService } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import LokiTransport from 'winston-loki';

export class LoggerBuilder {
  private jobName: string = 'ammerli-backend';
  private environment: string = 'development';

  setJobName(jobName: string) {
    this.jobName = jobName;
    return this;
  }

  setEnvironment(environment: string) {
    this.environment = environment;
    return this;
  }

  build(): LoggerService {
    const consoleFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.colorize(),
      winston.format.errors({ stack: true }),
      winston.format.printf(({ timestamp, level, message, context, trace }) => {
        const contextStr = context ? `[${context}] ` : '';
        const traceStr = trace ? `\n${trace}` : '';
        return `${timestamp} ${contextStr}${level}: ${message}${traceStr}`;
      }),
    );

    const lokiFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format((info) => {
        if (info.context) {
          info.context = info.context;
        }
        if (info.trace) {
          info.trace = info.trace;
        }
        return info;
      })(),
    );

    const transports: winston.transport[] = [
      new winston.transports.Console({
        format: consoleFormat,
        level: process.env.LOG_LEVEL || 'info',
        handleExceptions: true,
        handleRejections: true,
      }),
    ];

    const lokiHost = process.env.LOKI_HOST || 'http://loki:3100';
    const enableLoki = process.env.LOKI_ENABLED !== 'false';

    if (enableLoki && lokiHost) {
      console.log(`Initializing Loki transport to: ${lokiHost}`);

      transports.push(
        new LokiTransport({
          host: lokiHost,
          labels: {
            job: this.jobName,
            environment: this.environment,
            service: 'core',
            app: 'ammerli-backend',
            level: process.env.LOKI_LOG_LEVEL || 'info',
          },
          json: true,
          format: lokiFormat,
          replaceTimestamp: true,
          onConnectionError: (err: unknown) => {
            const errorMessage =
              err instanceof Error ? err.message : String(err);
            console.error('Loki connection error:', errorMessage);
          },
          batching: process.env.LOKI_BATCHING !== 'false',
          interval: parseInt(process.env.LOKI_INTERVAL || '5'),
          timeout: parseInt(process.env.LOKI_TIMEOUT || '15000'),
          gracefulShutdown: true,
        }) as any,
      );
    }

    return WinstonModule.createLogger({
      transports,
      exceptionHandlers: [
        new winston.transports.Console({
          format: consoleFormat,
        }),
      ],
      rejectionHandlers: [
        new winston.transports.Console({
          format: consoleFormat,
        }),
      ],
      exitOnError: false,
    });
  }
}
