import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { SMS_JOBS } from 'src/common/constants/jobs';
import { QUEUE_NAME } from 'src/common/constants/queues';
import { SmsSakOtpStrategy } from 'src/core/authentication/strategies/otp/smssak-otp.strategy';

export interface SendOtpJob {
  phoneNumber: string;
}

@Processor(QUEUE_NAME.SMS)
export class SmsProcessor extends WorkerHost {
  private readonly logger = new Logger(SmsProcessor.name);

  constructor(private readonly smsSakOtpStrategy: SmsSakOtpStrategy) {
    super();
  }

  async process(job: Job<SendOtpJob>) {
    switch (job.name) {
      case SMS_JOBS.SEND_OTP:
        try {
          await this.smsSakOtpStrategy.sendOtp(job.data.phoneNumber);
          this.logger.log(`OTP sent successfully to ${job.data.phoneNumber}`);
        } catch (error) {
          this.logger.error(
            `Failed to send OTP to ${job.data.phoneNumber}: ${error.message}`,
            error.stack,
          );
          throw error;
        }
        break;
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }
}
