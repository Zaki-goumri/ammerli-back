import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { AppModule } from './app.module';
import { LoggerInterceptor } from './monitoring/logger/logger.interceptor';
import { DatabaseExceptionFilter } from './common/filters/db.filter';
import { AppClusterService } from './infrastructure/clustring/app.cluster';
import { LoggerBuilder } from './monitoring/logger/logger.builder';
import helmet from 'helmet';
import BasicAuth = require('express-basic-auth');
import * as http from 'http';
import { HttpExceptionFilter } from './common/filters/httpException.filter';
import { ObjectStorageExceptionFilter } from './common/filters/object-storage.filter';
import { I18nService } from 'nestjs-i18n';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    logger:
      process.env.NODE_ENV === 'staging' || process.env.NODE_ENV === 'prod'
        ? new LoggerBuilder()
            .setJobName('core')
            .setEnvironment(process.env.NODE_ENV)
            .build()
        : ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  //eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const server: http.Server = app.getHttpServer();

  const KEEPALIVE_TIMEOUT_MS = 30000; // 30 seconds
  server.keepAliveTimeout = KEEPALIVE_TIMEOUT_MS;
  // headersTimeout must be slightly greater than keepAliveTimeout
  server.headersTimeout = KEEPALIVE_TIMEOUT_MS + 1000;
  // 2. Disable Nagle's algorithm on every new connection
  server.on('connection', (socket) => {
    socket.setNoDelay(true);
  });

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'api/v',
  });

  //SECURITY
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            "'unsafe-eval'",
            'https://cdn.jsdelivr.net',
            'https://unpkg.com',
          ],
          styleSrc: [
            "'self'",
            "'unsafe-inline'",
            'https://cdn.jsdelivr.net',
            'https://fonts.googleapis.com',
          ],
          fontSrc: [
            "'self'",
            'https://cdn.jsdelivr.net',
            'https://fonts.gstatic.com',
          ],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          workerSrc: ["'self'", 'blob:'],
          childSrc: ["'self'", 'blob:'],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );
  //INTERCEPTORS
  app.useGlobalInterceptors(
    new LoggerInterceptor(),
    //new ResponseFormatterInterceptor(),
  );
  // //PIPES
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      forbidUnknownValues: false,
    }),
  );

  //FILTERS
  const i18nService =
    app.get<I18nService<Record<string, unknown>>>(I18nService);
  app.useGlobalFilters(
    new DatabaseExceptionFilter(i18nService),
    new HttpExceptionFilter(i18nService),
    //   new ObjectStorageExceptionFilter(i18nService),
  );

  app.enableShutdownHooks();
  //Those to are for handling the shutdown of the server
  process.on('SIGINT', () => {
    console.log('Received SIGINT. Shutting down gracefully...');
    app
      .close()
      .then(() => {
        process.exit(0);
      })
      .catch((err) => {
        console.error('Error while shutting down gracefully:', err);
      });
  });
  process.on('SIGTERM', () => {
    console.log('Received SIGTERM. Shutting down gracefully...');
    app
      .close()
      .then(() => {
        process.exit(0);
      })
      .catch((e) => {
        console.log(e);
      });
  });

  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
  });

  const swaggerEnabled = process.env.SWAGGER_ENABLED === 'true';
  const swaggerUser = process.env.SWAGGER_USER || 'admin';
  const swaggerPassword = process.env.SWAGGER_PASSWORD || 'admin';

  if (swaggerEnabled) {
    app.use(
      '/api-docs',
      BasicAuth({
        challenge: true,
        users: {
          [swaggerUser]: swaggerPassword,
        },
        unauthorizedResponse: (req) => {
          return 'Unauthorized - Invalid credentials for API documentation';
        },
      }),
    );

    // Build Swagger document
    const config = new DocumentBuilder()
      .setTitle('Core Api Documentation')
      .setDescription('The Api Documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('Core')
      .build();

    const document = SwaggerModule.createDocument(app, config);

    // Setup Scalar API Reference with the document
    app.use(
      '/api-docs',
      apiReference({
        theme: 'solarized',
        spec: {
          content: document,
        },
      }),
    );
    console.log('Swagger documentation enabled at /api-docs');
  } else {
    console.log('Swagger documentation disabled');
  }

  //RUNNING THE APPLICATION
  const port = process.env.PORT || 3000;
  await app.listen(port);
}

const cluserizeApp = process.env.NUM_CPUS;

bootstrap()
  .then(() => {
    console.log(
      `Application is running on: ${process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`}`,
    );
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
