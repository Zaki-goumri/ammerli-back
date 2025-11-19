import { Injectable, Logger } from '@nestjs/common';
import { OtpStrategy } from './otp.strategy';
import { RedisService } from 'nestjs-redis-client';
import { NotificationsService } from 'src/core/notifications/notifications.service';

@Injectable()
export class DefaultOtpStrategy extends OtpStrategy {
  private static readonly CACHE_KEY_PREFIX = 'otp';
  private static readonly OTP_EXPIRATION_SECONDS = 600;
  private static readonly OTP_LENGTH = 4;
  private readonly logger = new Logger(DefaultOtpStrategy.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly notificationsService: NotificationsService,
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
    // TODO: replace with actual fcm token
    const fcmToken =
      'dHa4QQkTRJqOauLbM2Uksu:APA91bEpr4tr1qoVNhk7TGJrk2jXg89onaBREZwKgTFtEhwL9h1JKPsE9n9vUnGgWTUNTPX0NdImIaQbm5TV3aiLH_e8RVk6UUHOzxs9FPb8BJnREgQ6a6Y';
    await this.notificationsService.sendOtpViaNotification(fcmToken, otp);

    this.logger.log(`OTP for ${phoneNumber} is ${otp}`);
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
