import { AppService } from './app.service';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QUEUE_NAME } from './common/constants/queues';
import redisConfig from './config/redis.config';
import authConfig from './config/auth.config';
import appConfig from './config/app.config';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { SecurityModule } from './security/security.module';
import { CommonModule } from './common/modules/common.module';
import { CoreModule } from './core/core.module';
import elasticSearchConfig from './config/elastic-search.config';
import dbConfig from './config/db.config';
import chargiliConfig from './config/chargili.config';
import minioConfig from './config/minio.config';
import firebaseConfig from './config/firebase.config';
import smsConfig from './config/sms.config';
import { APP_GUARD } from '@nestjs/core';
import throttlerConfig from './config/throttler.config';
import { AppController } from './app.controller';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { GlobalThrottlerGuard } from './security/rate-limiting/global-throttler.guard';
import { RealIpMiddleware } from './common/middlewares/real-ip.middleware';
import { I18nModule, AcceptLanguageResolver, QueryResolver } from 'nestjs-i18n';
import path from 'path';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: null,
      expandVariables: true,
      load: [
        firebaseConfig,
        minioConfig,
        redisConfig,
        authConfig,
        appConfig,
        elasticSearchConfig,
        dbConfig,
        chargiliConfig,
        smsConfig,
        throttlerConfig,
      ],
    }),
    BullModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const redisHost = configService.get<string>('redis.host');
        const redisPort = configService.get<number>('redis.port');
        const redisUrl = `redis://${redisHost}:${redisPort}`;
        return {
          connection: {
            host: redisHost,
            port: redisPort,
            url: redisUrl,
            db: 3,
          },
        };
      },
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      ...Object.values(QUEUE_NAME).map((queueName) => ({
        name: queueName,
      })),
    ),
    InfrastructureModule,
    MonitoringModule,
    SecurityModule,
    CommonModule,
    CoreModule,
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(__dirname, '/i18n/'),
        watch: true,
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
      ],
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: GlobalThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RealIpMiddleware).forRoutes('*');
  }
}
