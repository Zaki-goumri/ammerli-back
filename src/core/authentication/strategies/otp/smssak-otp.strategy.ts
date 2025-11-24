import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { OtpStrategy } from './otp.strategy';
import { sendOtp, verifyOtp, sendMessage } from 'smssak';
import { QUEUE_NAME } from 'src/common/constants/queues';
import { SMS_JOBS } from 'src/common/constants/jobs';
import { RedisService } from 'nestjs-redis-client';

@Injectable()
export class SmsSakOtpStrategy extends OtpStrategy {
  private readonly logger = new Logger(SmsSakOtpStrategy.name);

  private readonly country: string;
  private readonly projectId: string;
  private readonly key: string;
  private readonly type: string;

  constructor(
    private configService: ConfigService,
    @InjectQueue(QUEUE_NAME.SMS) private readonly smsQueue: Queue,
    private readonly redisService: RedisService,
  ) {
    super();
    this.country = this.configService.get<string>('sms.smssak.country')!;
    this.projectId = this.configService.get<string>('sms.smssak.projectId')!;
    this.key = this.configService.get<string>('sms.smssak.key')!;
    this.type = this.configService.get<string>('sms.smssak.type')!;
  }

  private generateOtp(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  async sendOtp(phoneNumber: string): Promise<void> {
    if (this.type === 'sms') {
      try {
        await sendOtp(
          this.country,
          this.projectId,
          phoneNumber,
          this.key,
          this.type,
        );
        this.logger.log(`OTP sent via smssak to ${phoneNumber}`);
      } catch (error) {
        this.logger.error(
          `Failed to send OTP via smssak to ${phoneNumber}: ${error.message}`,
          error.stack,
        );
        new InternalServerErrorException({
          key: 'auth.otp.providerFailed',
          args: { message: error.message },
        });
      }
    } else {
      const otp = this.generateOtp();
      const message = `Your verification code is: ${otp}`;

      try {
        await this.redisService.set(`otp:${phoneNumber}`, otp, 5 * 60); // 5 minutes expiration
        await sendMessage(
          this.country,
          this.projectId,
          phoneNumber,
          this.key,
          message,
        );
        this.logger.log(`OTP message sent via smssak to ${phoneNumber}`);
      } catch (error) {
        this.logger.error(
          `Failed to send OTP message via smssak to ${phoneNumber}: ${error.message}`,
          error.stack,
        );
        // Attempt to clean up Redis key if SMS sending fails
        await this.redisService.del(`otp:${phoneNumber}`);
        throw new Error('Failed to send OTP via SMS provider');
      }
    }
  }

  async send(phoneNumber: string): Promise<void> {
    await this.smsQueue.add(
      SMS_JOBS.SEND_OTP,
      { phoneNumber },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    );
    this.logger.log(`OTP queued for ${phoneNumber}`);
  }

  async verify(phoneNumber: string, otp: string): Promise<boolean> {
    if (this.type === 'sms') {
      try {
        const response = await verifyOtp(
          this.country,
          phoneNumber,
          this.projectId,
          otp,
          this.key,
        );
        if (response.status !== 200) {
          this.logger.warn(`Invalid OTP for ${phoneNumber}`);
          return false;
        }
        this.logger.log(`OTP verified via smssak for ${phoneNumber}`);
        return true;
      } catch (error) {
        this.logger.error(
          `Failed to verify OTP via smssak for ${phoneNumber}: ${error.message}`,
          error.stack,
        );
        return false;
      }
    } else {
      const storedOtp = await this.redisService.get(`otp:${phoneNumber}`);

      if (!storedOtp) {
        this.logger.warn(`No OTP found in Redis for ${phoneNumber}`);
        return false;
      }

      if (storedOtp !== otp) {
        this.logger.warn(`Invalid OTP for ${phoneNumber}`);
        return false;
      }

      await this.redisService.del(`otp:${phoneNumber}`);
      this.logger.log(`OTP verified for ${phoneNumber}`);
      return true;
    }
  }
}
