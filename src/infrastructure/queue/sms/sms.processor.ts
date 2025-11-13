import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { SMS_JOBS } from 'src/common/constants/jobs';
import { QUEUE_NAME } from 'src/common/constants/queues';

export interface SmsJob {
  to: string;
  body: string;
}

@Processor(QUEUE_NAME.SMS)
export class SmsProcessor extends WorkerHost {
  private readonly logger = new Logger(SmsProcessor.name);

  async process(job: Job<SmsJob>) {
    switch (job.name) {
      case SMS_JOBS.SEND_SMS:
        // TODO: Integrate with actual SMS service provider here
        this.logger.log(`Sending SMS to ${job.data.to}: "${job.data.body}"`);
        break;
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }
}
