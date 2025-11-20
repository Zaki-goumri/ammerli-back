import { LoggerService } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import 'winston-daily-rotate-file'; // This extends winston.transports
import LokiTransport from 'winston-loki';
import * as path from 'path';

export class LoggerBuilder {
  private jobName: string;
  private environment: string;

  setJobName(jobName: string) {
    this.jobName = jobName;
    return this;
  }

  setEnvironment(environment: string) {
    this.environment = environment;
    return this;
  }

  build(): LoggerService {
    const isProduction =
      process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'prod';
    const logLevel = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug');

    const baseFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.json(),
    );

    const transports: winston.transport[] = [];

    // Console Transport
    transports.push(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          winston.format.printf(
            ({ timestamp, level, message, context, trace }) => {
              const contextStr = context ? `[${context}]` : '';
              const traceStr = trace ? `\n${trace}` : '';
              return `${timestamp} ${level} ${contextStr}: ${message}${traceStr}`;
            },
          ),
        ),
        level: logLevel,
      }),
    );

    transports.push(
      new (winston.transports as any).DailyRotateFile({
        filename: path.join('logs', 'application-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
        format: baseFormat,
        level: 'info',
      }),
    );

    transports.push(
      new (winston.transports as any).DailyRotateFile({
        filename: path.join('logs', 'error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '30d',
        format: baseFormat,
        level: 'error',
      }),
    );

    // Debug file for development
    if (!isProduction) {
      transports.push(
        new winston.transports.File({
          filename: path.join('logs', 'debug.log'),
          format: baseFormat,
          level: 'debug',
        }),
      );
    }

    // Loki Transport for production
    if (isProduction && process.env.LOKI_HOST) {
      try {
        const lokiTransport = new LokiTransport({
          host: process.env.LOKI_HOST,
          labels: {
            job: this.jobName || 'nestjs-app',
            environment: this.environment || process.env.NODE_ENV || 'dev',
            service: 'core',
            version: process.env.APP_VERSION || '1.0.0',
          },
          json: true,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
          replaceTimestamp: true,
          onConnectionError: (err) => {
            console.error('Loki connection error:', err);
          },
          level: logLevel,
          batching: true,
          interval: 5,
          gracefulShutdown: true,
          timeout: 10000,
          basicAuth: process.env.LOKI_AUTH ? process.env.LOKI_AUTH : undefined,
          headers: {
            'Content-Type': 'application/json',
          },
        });

        transports.push(lokiTransport);
        console.log('✅ Loki transport configured successfully');
      } catch (error) {
        console.error('❌ Failed to configure Loki transport:', error);
      }
    }

    const logger = WinstonModule.createLogger({
      format: baseFormat,
      transports,
      exceptionHandlers: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, stack }) => {
              return `${timestamp} ${level}: ${message}\n${stack}`;
            }),
          ),
        }),
        new winston.transports.File({
          filename: path.join('logs', 'exceptions.log'),
          format: baseFormat,
        }),
      ],
      rejectionHandlers: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, stack }) => {
              return `${timestamp} ${level}: ${message}\n${stack}`;
            }),
          ),
        }),
        new winston.transports.File({
          filename: path.join('logs', 'rejections.log'),
          format: baseFormat,
        }),
      ],
      exitOnError: false,
    });

    return logger;
  }
}
