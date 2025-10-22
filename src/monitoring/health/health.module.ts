import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { TerminusModule, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisCustomHealthIndicator } from './redis.health';
import { HttpModule } from '@nestjs/axios';
import { RedisService } from 'nestjs-redis-client';
@Module({
  controllers: [HealthController],
  imports: [TerminusModule, TypeOrmModule, HttpModule],
  providers: [TypeOrmHealthIndicator, RedisCustomHealthIndicator],
})
export class HealthModule {}
