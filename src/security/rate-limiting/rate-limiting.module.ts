import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import throttlerConfig from 'src/config/throttler.config';
import redisConfig from 'src/config/redis.config';

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [
        ConfigModule.forFeature(throttlerConfig),
        ConfigModule.forFeature(redisConfig),
      ],
      inject: [throttlerConfig.KEY, redisConfig.KEY],
      useFactory: (
        config: ConfigType<typeof throttlerConfig>,
        redis: ConfigType<typeof redisConfig>,
      ) => ({
        throttlers: [
          {
            name: 'global',
            limit: config.limit,
            ttl: config.ttl * 1000, // Convert to milliseconds
            blockDuration: config.blockDuration * 1000,
          },
        ],
        ignoreUserAgents: config.ignoreUserAgents.map(
          (agent) => new RegExp(agent),
        ),
        // Redis storage for rate limiting
        storage: new ThrottlerStorageRedisService({
          host: redis.host,
          port: redis.port,
          db: 4,
        }),
      }),
    }),
  ],
  exports: [ThrottlerModule],
})
export class RateLimitingModule {}
