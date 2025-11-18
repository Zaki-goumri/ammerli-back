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

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    logger:
      process.env.ENV === 'staging' || process.env.ENV === 'prod'
        ? new LoggerBuilder()
            .setJobName('core')
            .setEnvironment(process.env.ENV)
            .build()
        : ['log', 'error', 'warn', 'debug', 'verbose'],
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
          scriptSrc: ["'self'", 'https://cdn.jsdelivr.net', "'unsafe-inline'"], // Added unsafe-inline for Scalar
          styleSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
          fontSrc: ["'self'", 'https://cdn.jsdelivr.net'],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
        },
      },
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
      forbidNonWhitelisted: true,
      transform: true,
      forbidUnknownValues: true,
    }),
  );

  //FILTERS
  app.useGlobalFilters(new DatabaseExceptionFilter());

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
    console.log('✓ Swagger documentation enabled at /api-docs');
  } else {
    console.log('✗ Swagger documentation disabled');
  }

  //RUNNING THE APPLICATION
  const port = process.env.PORT || 3000;
  await app.listen(port);
}

const cluserizeApp = process.env.NUM_CPUS;

if (cluserizeApp) {
  AppClusterService.clusterize(async () => {
    await bootstrap();
  });
} else {
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
}
