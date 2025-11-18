import { LoggerService } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import LokiTransport from 'winston-loki';

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
    const transports: winston.transport[] = [
      // Console transport - always enabled
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          winston.format.colorize(),
          winston.format.printf(
            ({ timestamp, level, message, context, trace }) => {
              const contextStr = context ? `[${context}] ` : '';
              const traceStr = trace ? `\n${trace}` : '';
              return `${timestamp} ${contextStr}${level}: ${message}${traceStr}`;
            },
          ),
        ),
        level: process.env.LOG_LEVEL || 'info',
      }),
    ];

    // Add Loki transport only in staging/production
    if (process.env.ENV === 'STAGING' || process.env.ENV === 'PRODUCTION') {
      transports.push(
        new LokiTransport({
          host: process.env.LOKI_HOST || 'http://loki:3100',
          labels: {
            job: this.jobName || 'nestjs-app',
            environment: this.environment || process.env.ENV || 'development',
            service: 'core',
          },
          json: true,
          format: winston.format.json(),
          replaceTimestamp: true,
          batching: true,
          interval: 5, // Send logs every 5 seconds
          gracefulShutdown: true,
          onConnectionError: (err) => {
            console.error('Loki connection error:', err);
          },
        }),
      );
    }

    return WinstonModule.createLogger({
      transports,
      exceptionHandlers: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.json(),
          ),
        }),
      ],
      rejectionHandlers: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.json(),
          ),
        }),
      ],
    });
  }
}
