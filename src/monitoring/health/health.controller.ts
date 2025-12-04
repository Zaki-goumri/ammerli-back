import { Controller, Get, InternalServerErrorException } from '@nestjs/common';
import {
  DiskHealthIndicator,
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { RedisCustomHealthIndicator } from './redis.health';
import { ApiExcludeController } from '@nestjs/swagger';

@Controller('health')
@ApiExcludeController()
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private disk: DiskHealthIndicator,
    private db: TypeOrmHealthIndicator,
    private redis: RedisCustomHealthIndicator,
  ) {}

  @Get('db')
  @HealthCheck()
  checkDb() {
    return this.health.check([() => this.db.pingCheck('database')]);
  }

  @Get('redis')
  @HealthCheck()
  checkRedis() {
    return this.health.check([() => this.redis.isHealthy('redis')]);
  }

  @Get('status')
  checkStatus() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('test-slack')
  async testSlackAlert() {
    throw new InternalServerErrorException(
      'This is a test error for Slack alerting',
    );
  }

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.redis.isHealthy('redis'),
      () =>
        this.disk.checkStorage('disk health', {
          thresholdPercent: 0.9,
          path: '/',
        }),
    ]);
  }
}
