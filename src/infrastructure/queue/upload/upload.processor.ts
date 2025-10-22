import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { UPLOAD_JOBS } from 'src/common/constants/jobs';
import { QUEUE_NAME } from 'src/common/constants/queues';
import { UploadJobDto } from './dto/upload-job.dto';
import { ObjectService } from '../../object-storage/object-storage.service';

@Processor(QUEUE_NAME.UPLOAD)
export class UploadProcessor extends WorkerHost {
  constructor(private readonly objectStorageService: ObjectService) {
    super();
  }
  process(job: Job<UploadJobDto>, token?: string): Promise<any> {
    switch (job.name) {
      case UPLOAD_JOBS.UPLOAD_FILE:
        console.log(job.data);
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
