import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import throttlerConfig from 'src/config/throttler.config';

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule.forFeature(throttlerConfig)],
      inject: [throttlerConfig.KEY],
      useFactory: (config: ConfigType<typeof throttlerConfig>) => ({
        throttlers: [
          {
            name: 'global',
            limit: config.limit,
            ttl: config.ttl * 1000, // Convert to milliseconds
            blockDuration: config.blockDuration * 1000, // Convert to milliseconds
          },
        ],
        ignoreUserAgents: config.ignoreUserAgents,
      }),
    }),
  ],
  exports: [ThrottlerModule],
})
export class RateLimitingModule {}
