import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { AppModule } from './app.module';
import { LoggerInterceptor } from './monitoring/logger/logger.interceptor';
import { DatabaseExceptionFilter } from './common/filters/db.filter';
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: process.env.FRONTENT_URL || 'http://localhost:5372',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      credentials: true,
    },
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
    snapshot: true,
  });

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1', // Optional: default version if none specified
    prefix: 'api/v', // Optional: custom prefix (default is 'v')
  });

  //SECURITY
  // added a basic auth for the swagger docs
  // TODO: add those into .env
  // app.use(
  //   ['/api-docs', '/api-docs-json'],
  //   BasicAuth({
  //     users: { admin: 'admin' },
  //     challenge: true,
  //   }),
  // );
  // app.use(
  //   helmet({
  //     contentSecurityPolicy: {
  //       directives: {
  //         defaultSrc: ["'self'"],
  //         scriptSrc: ["'self'", 'https://cdn.jsdelivr.net'],
  //         styleSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
  //         fontSrc: ["'self'", 'https://cdn.jsdelivr.net'],
  //       },
  //     },
  //   }),
  // );
  //
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
  //app.useGlobalFilters(new ElasticSearchExceptionFilter()); //TODO:figure out what error to catch
  //--
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

  const config = new DocumentBuilder()
    .setTitle('Core Api Documentation')
    .setDescription('The Api Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Core')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  app.use(
    '/api-docs',
    apiReference({
      theme: 'solarized',
      content: document,
    }),
  );

  //RUNNING THE APPLICATION
  const port = process.env.PORT || 3000;
  await app.listen(port);
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
