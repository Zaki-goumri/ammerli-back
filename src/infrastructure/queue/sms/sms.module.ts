import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { SmsProcessor } from './sms.processor';
import { SmsSakOtpStrategy } from 'src/core/authentication/strategies/otp/smssak-otp.strategy';
import smsConfig from 'src/config/sms.config';

@Module({
  imports: [HttpModule, ConfigModule.forFeature(smsConfig)],
  providers: [SmsProcessor, SmsSakOtpStrategy],
  exports: [SmsProcessor],
})
export class SmsModule {}
