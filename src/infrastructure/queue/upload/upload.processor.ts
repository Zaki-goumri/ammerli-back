import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { UPLOAD_JOBS } from 'src/common/constants/jobs';
import { QUEUE_NAME } from 'src/common/constants/queues';
import { UploadJobDto } from './dto/upload-job.dto';
import { ObjectService } from '../../object-storage/object-storage.service';
import { Logger } from '@nestjs/common';

@Processor(QUEUE_NAME.UPLOAD)
export class UploadProcessor extends WorkerHost {
  constructor(private readonly objectStorageService: ObjectService) {
    super();
  }

  logger = new Logger(UploadProcessor.name);

  process(job: Job<UploadJobDto>): Promise<any> {
    switch (job.name) {
      case UPLOAD_JOBS.UPLOAD_FILE:
        this.logger.log(`Processing upload file job: ${job.id}`);
        return this.objectStorageService.uploadFile(
          job.data.file,
          job.data.options,
        );
      case UPLOAD_JOBS.DELETE_FILE:
        throw new Error('Method not implemented.');
      case UPLOAD_JOBS.UPLOAD_MULTIPLE_FILES:
        throw new Error('Method not implemented.');
      default:
        return Promise.resolve({
          message: 'Upload job processed',
          jobId: job.id,
        });
    }
  }
}
