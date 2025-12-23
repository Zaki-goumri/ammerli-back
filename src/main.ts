import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { AppModule } from './app.module';
import { LoggerInterceptor } from './monitoring/logger/logger.interceptor';
import { LoggerBuilder } from './monitoring/logger/logger.builder';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      trustProxy: '172.20.0.0/16',
      routerOptions: {
        ignoreDuplicateSlashes: true,
        ignoreTrailingSlash: true,
      },
    }),
    {
      bufferLogs: true,
      logger:
        process.env.NODE_ENV === 'staging' || process.env.NODE_ENV === 'prod'
          ? new LoggerBuilder()
              .setJobName('core')
              .setEnvironment(process.env.NODE_ENV)
              .build()
          : ['log', 'error', 'warn', 'debug', 'verbose'],
    },
  );

  await app.register(multipart);
  await app.register(fastifyStatic, {
    root: join(__dirname, '..', 'public'),
    prefix: '/public/',
  });

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'api/v',
  });

  //SECURITY
  await app.register(helmet, {
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
  });
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
    const config = new DocumentBuilder()
      .setTitle('Core Api Documentation')
      .setDescription('The Api Documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('Core')
      .build();

    const document = SwaggerModule.createDocument(app, config);

    // Simple basic auth middleware
    const fastifyInstance = app.getHttpAdapter().getInstance();
    fastifyInstance.addHook('onRequest', async (request: any, reply: any) => {
      if (request.url.startsWith('/api-docs')) {
        const authHeader = request.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Basic ')) {
          reply.code(401);
          reply.header('WWW-Authenticate', 'Basic realm="Swagger Documentation"');
          return reply.send('Authentication required');
        }

        const base64Credentials = authHeader.split(' ')[1];
        const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
        const [username, password] = credentials.split(':');

        if (username !== swaggerUser || password !== swaggerPassword) {
          reply.code(401);
          reply.header('WWW-Authenticate', 'Basic realm="Swagger Documentation"');
          return reply.send('Invalid credentials');
        }
      }
    });

    app.use(
      '/api-docs',
      apiReference({
        content: document,
        withFastify: true,
      }),
    );

    console.log('Swagger documentation enabled at /api-docs');
    console.log(`Swagger credentials - User: ${swaggerUser}`);
  } else {
    console.log('Swagger documentation disabled');
  }

  //RUNNING THE APPLICATION
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
}

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
