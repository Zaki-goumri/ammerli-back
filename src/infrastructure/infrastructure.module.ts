import { Module } from '@nestjs/common';
import { DbModule } from './db/db.module';
import { QueueModule } from './queue/queue.module';
import { RedisModule } from 'nestjs-redis-client';
import { ConfigType } from '@nestjs/config';
import redisConfig from 'src/config/redis.config';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_NAME } from 'src/common/constants/queues';
import { ObjectStorageModule } from './object-storage/object-storage.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { FirebaseModule } from './firebase/firebase.module';
import firebaseConfig from 'src/config/firebase.config';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    DbModule,
    ObjectStorageModule,
    QueueModule,
    RedisModule.registerAsync(redisConfig.asProvider()),
    BullModule.forRootAsync({
      inject: [redisConfig.KEY],
      useFactory: (config: ConfigType<typeof redisConfig>) => {
        return {
          connection: {
            host: config.host,
            port: config.port,
            url: `redis://${config.host}:${config.port}`,
            db: 3, // Default database
          },
        };
      },
    }),
    BullModule.registerQueue(
      ...Object.values(QUEUE_NAME).map((queueName) => ({
        name: queueName,
      })),
    ),
    FirebaseModule.forRootAsync(firebaseConfig.asProvider()),
  ],
  exports: [
    RedisModule,
    QueueModule,
    ObjectStorageModule,
    BullModule,
    DbModule,
    FirebaseModule,
  ],
})
export class InfrastructureModule {}
