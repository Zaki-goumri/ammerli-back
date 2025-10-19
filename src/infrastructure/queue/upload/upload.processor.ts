import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { UPLOAD_JOBS } from 'src/common/constants/jobs';
import { QUEUE_NAME } from 'src/common/constants/queues';
import { UploadJobDto } from './dto/upload-job.dto';
import { Inject } from '@nestjs/common';
import { ObjectStorageMethods } from 'src/infrastructure/object-storage/object-storage.interface';

@Processor(QUEUE_NAME.UPLOAD)
export class UploadProcessor extends WorkerHost {
  constructor(
    @Inject('ObjectStorage')
    private readonly objectStorageService: ObjectStorageMethods,
  ) {
    super();
  }
  process(job: Job<UploadJobDto>, token?: string): Promise<any> {
    switch (job.name) {
      case UPLOAD_JOBS.UPLOAD_FILE:
        return this.objectStorageService.uploadFile(
          job.data.file,
          job.data.options,
        );
      case UPLOAD_JOBS.DELETE_FILE:
        throw new Error('Method not implemented.');
      default:
        return Promise.resolve({
          message: 'Upload job processed',
          jobId: job.id,
        });
    }
  }
}
