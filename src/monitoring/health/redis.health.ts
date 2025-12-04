import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { RedisService } from 'nestjs-redis-client';

@Injectable()
export class RedisCustomHealthIndicator extends HealthIndicator {
  constructor(private readonly redisService: RedisService) {
    super();
  }
  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.redisService['cachedClient'].ping();
      await this.redisService['subscriberClient'].ping();
      return this.getStatus(key, true);
    } catch (err) {
      throw new HealthCheckError('Redis health check failed', err);
    }
  }
}
