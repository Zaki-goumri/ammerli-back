import { Controller, Get } from '@nestjs/common';
import {
  DiskHealthIndicator,
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
  MemoryHealthIndicator,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { RedisCustomHealthIndicator } from './redis.health';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private disk: DiskHealthIndicator,
    private memory: MemoryHealthIndicator,
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
      () => this.memory.checkHeap('memory heap', 150 * 1024 * 1024),
      () => this.memory.checkRSS('memory RSS', 300 * 1024 * 1024),
    ]);
  }
}
