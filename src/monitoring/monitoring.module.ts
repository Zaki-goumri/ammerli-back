import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { LoggerModule } from './logger/logger.module';
import { AlertingModule } from './alerting/alerting.module';

@Module({
  imports: [HealthModule, LoggerModule, AlertingModule],
  exports: [AlertingModule],
})
export class MonitoringModule {}
