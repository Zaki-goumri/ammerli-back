import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

export interface SmsJob {
  to: string;
  body: string;
}

@Processor('sms')
export class SmsProcessor extends WorkerHost {
  private readonly logger = new Logger(SmsProcessor.name);

  async process(job: Job<SmsJob>) {
    switch (job.name) {
      case 'send_sms':
        // TODO: Integrate with actual SMS service provider here
        this.logger.log(`Sending SMS to ${job.data.to}: "${job.data.body}"`);
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }
}
