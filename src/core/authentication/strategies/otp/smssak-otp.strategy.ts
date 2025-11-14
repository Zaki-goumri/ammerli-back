import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OtpStrategy } from './otp.strategy';
import { sendOtp, verifyOtp } from 'smssak';

@Injectable()
export class SmsSakOtpStrategy extends OtpStrategy {
  private readonly logger = new Logger(SmsSakOtpStrategy.name);

  private readonly country: string;
  private readonly projectId: string;
  private readonly key: string;
  private readonly type: string;

  constructor(private configService: ConfigService) {
    super();
    this.country = this.configService.get<string>('sms.smssak.country')!;
    this.projectId = this.configService.get<string>('sms.smssak.projectId')!;
    this.key = this.configService.get<string>('sms.smssak.key')!;
    this.type = this.configService.get<string>('sms.smssak.type')!;
  }

  async send(phoneNumber: string): Promise<void> {
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
      );
      throw new Error('Failed to send OTP via SMS provider');
    }
  }

  async verify(phoneNumber: string, otp: string): Promise<boolean> {
    try {
      await verifyOtp(this.country, phoneNumber, this.projectId, otp, this.key);
      this.logger.log(`OTP verified via smssak for ${phoneNumber}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to verify OTP via smssak for ${phoneNumber}: ${error.message}`,
      );
      return false;
    }
  }
}
