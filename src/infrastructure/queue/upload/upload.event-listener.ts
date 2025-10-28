import {
  OnQueueEvent,
  QueueEventsHost,
  QueueEventsListener,
} from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { UploadApiResponse } from 'cloudinary';
import { QUEUE_NAME } from 'src/common/constants/queues';

@QueueEventsListener(QUEUE_NAME.UPLOAD)
export class UploadEventListener extends QueueEventsHost {
  logger = new Logger(UploadEventListener.name);
  @OnQueueEvent('completed')
  onCompleted({
    jobId,
    returnvalue,
  }: {
    jobId: number | string;
    returnvalue: UploadApiResponse;
  }) {
    this.logger.log(
      `Job with ID ${jobId} has completed. Return value:`,
      returnvalue.secure_url,
    );
  }

  @OnQueueEvent('failed')
  onFailed({
    jobId,
    failedReason,
  }: {
    jobId: number | string;
    failedReason: string;
  }) {
    console.error(`Job with ID ${jobId} has failed. Reason: ${failedReason}`);
  }
  @OnQueueEvent('active')
  onActive({ jobId, prev }: { jobId: number | string; prev: string }) {
    this.logger.log(
      `Job with ID ${jobId} is now active. Previous status: ${prev}`,
    );
  }
}
