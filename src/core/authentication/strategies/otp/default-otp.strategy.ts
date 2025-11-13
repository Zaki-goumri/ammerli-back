import { Injectable } from '@nestjs/common';
import { OtpStrategy } from './otp.strategy';
import { RedisService } from 'nestjs-redis-client';
import { InjectQueue } from '@nestjs/bullmq';
import { QUEUE_NAME } from 'src/common/constants/queues';
import { Queue } from 'bullmq';
import { SMS_JOBS } from 'src/common/constants/jobs';

@Injectable()
export class DefaultOtpStrategy extends OtpStrategy {
  private static readonly CACHE_KEY_PREFIX = 'otp';
  private static readonly OTP_EXPIRATION_SECONDS = 600;
  private static readonly OTP_LENGTH = 4;

  constructor(
    private readonly redisService: RedisService,
    @InjectQueue(QUEUE_NAME.SMS) private readonly smsQueue: Queue,
  ) {
    super();
  }

  private static getCacheKey(key: string): string {
    return `${this.CACHE_KEY_PREFIX}:${key}`;
  }

  async send(phoneNumber: string): Promise<void> {
    const min = Math.pow(10, DefaultOtpStrategy.OTP_LENGTH - 1);
    const max = Math.pow(10, DefaultOtpStrategy.OTP_LENGTH) - 1;
    const otp = Math.floor(min + Math.random() * (max - min + 1)).toString();

    await this.redisService.set(
      DefaultOtpStrategy.getCacheKey(phoneNumber),
      otp,
      DefaultOtpStrategy.OTP_EXPIRATION_SECONDS,
    );

    await this.smsQueue.add(SMS_JOBS.SEND_SMS, {
      to: phoneNumber,
      body: `Your OTP is: ${otp}`,
    });
  }

  async verify(phoneNumber: string, otp: string): Promise<boolean> {
    const cachedOtp = await this.redisService.get<string>(
      DefaultOtpStrategy.getCacheKey(phoneNumber),
    );

    if (!cachedOtp || cachedOtp !== otp) {
      return false;
    }

    // OTP is valid, delete it from Redis
    await this.redisService.del(DefaultOtpStrategy.getCacheKey(phoneNumber));
    return true;
  }
}
