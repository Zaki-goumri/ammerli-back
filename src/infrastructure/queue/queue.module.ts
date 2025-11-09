import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { QUEUE_NAME } from 'src/common/constants/queues';
import redisConfig from 'src/config/redis.config';
import { UploadProcessor } from './upload/upload.processor';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { NotificationProcessor } from './notification/notification.processor';
import { FirebaseModule } from '../firebase/firebase.module';
import { ObjectStorageModule } from '../object-storage/object-storage.module';
import { NotificationsModule } from 'src/core/notifications/notifications.module';
import { InvoiceProcessor } from './invoice/invoice.processor';

@Global()
@Module({
  imports: [
    EventEmitterModule,
    ObjectStorageModule,
    NotificationsModule,
    FirebaseModule,
    BullModule.forRootAsync({
      useFactory: (configService: ConfigType<typeof redisConfig>) => {
        const redisHost = configService.host;
        const redisPort = configService.port;
        const redisUrl = `redis://${redisHost}:${redisPort}`;
        return {
          connection: {
            host: redisHost,
            port: redisPort,
            url: redisUrl,
            db: 3, // Default database
          },
        };
      },

      inject: [redisConfig.KEY],
    }),
    BullModule.registerQueue(
      ...Object.values(QUEUE_NAME).map((queueName) => ({
        name: queueName,
      })),
    ),
  ],
  providers: [UploadProcessor, NotificationProcessor, InvoiceProcessor],
  exports: [BullModule],
})
export class QueueModule {}
