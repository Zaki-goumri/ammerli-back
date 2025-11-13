import { Injectable, Logger } from '@nestjs/common';
import { OtpStrategy } from './otp.strategy';
import { sendOtp, verifyOtp } from 'smssak'; // Assuming smssak exports these functions

@Injectable()
export class SmsSakOtpStrategy extends OtpStrategy {
  private readonly logger = new Logger(SmsSakOtpStrategy.name);

  private readonly country = 'dz';
  private readonly projectId = '3ammerli-vd9aq'; // Replace with actual project ID
  private readonly key =
    'd2db0df0ee7de529a1876948ba50e909:44e3362616a805908d9aa38dade474af33907f00de7fded9fe4e98f95895a47df67a3ae4dfe5edb67bf1df8038b26b7821a2d623a5596c9174ed60f04f5aaebfd78d103851feb9ee9d226adfcf69addf'; // Replace with actual API key
  private readonly type = 'sms'; // Assuming 'sms' as default

  async send(phoneNumber: string): Promise<void> {
    try {
      // smssak.sendOtp does not take a custom message body.
      // It generates and sends its own OTP message.
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
