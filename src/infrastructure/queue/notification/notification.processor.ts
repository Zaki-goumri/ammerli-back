import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QUEUE_NAME } from 'src/common/constants/queues';
import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NOTIFICATION_JOBS } from 'src/common/constants/jobs';

@Processor(QUEUE_NAME.NOTIFICATION)
export class UploadProcessor extends WorkerHost {
  constructor() {
    super();
  }

  logger = new Logger(UploadProcessor.name);

  process(job: Job<any>): Promise<any> {
    switch (job.name) {
      case NOTIFICATION_JOBS.SEND_NOTIFICATION:
        this.logger.log(`Processing send notification job: ${job.id}`);
        // Implement your notification sending logic here
        return Promise.resolve({
          message: 'Notification sent',
          jobId: job.id,
        });
      case NOTIFICATION_JOBS.SEND_BULK_NOTIFICATION:
        this.logger.log(`Processing log event job: ${job.id}`);
      // Implement your event logging logic here
      default:
        return Promise.resolve({
          message: 'Upload job processed',
          jobId: job.id,
        });
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job completed: ${job.id}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job) {
    this.logger.log(`Job failed: ${job.id}`);
  }
}
