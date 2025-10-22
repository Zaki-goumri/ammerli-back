import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { UPLOAD_JOBS } from 'src/common/constants/jobs';
import { QUEUE_NAME } from 'src/common/constants/queues';
import { UploadJobDto } from './dto/upload-job.dto';
import { ObjectService } from '../../object-storage/object-storage.service';
import { Logger } from '@nestjs/common';
import { FinalizePayloadDto } from './dto/finalize-payload.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Processor(QUEUE_NAME.UPLOAD)
export class UploadProcessor extends WorkerHost {
  constructor(
    private readonly objectStorageService: ObjectService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    super();
  }

  logger = new Logger(UploadProcessor.name);

  process(
    job: Job<UploadJobDto>,
  ): Promise<FinalizePayloadDto | { message: string; jobId?: string }> {
    switch (job.name) {
      case UPLOAD_JOBS.UPLOAD_FILE:
        this.logger.log(`Processing upload file job: ${job.id}`);
        return this.handleUploading(job.data);
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

  async handleUploading(data: UploadJobDto): Promise<FinalizePayloadDto> {
    this.logger.log('Handling uploading...');
    const result = await this.objectStorageService.uploadFile(
      data.file,
      data.options,
    );
    this.logger.log('Uploading handled.');
    return {
      fileUrl: result.fileUrl,
      targetId: parseInt(data.metadata.targetId),
      targetType: data.metadata.targetType,
    };
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job completed: ${job.id}`);
    const { fileUrl, targetId, targetType } =
      job.returnvalue as FinalizePayloadDto;
    const eventName = `file.uploaded.${targetType}`;
    this.logger.log(
      `Dispatching NestJS event: ${eventName} for target ID: ${targetId}`,
    );
    this.eventEmitter.emit(eventName, {
      targetId,
      fileUrl,
      jobId: job.id,
    });
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job) {
    this.logger.log(`Job failed: ${job.id}`);
    const { fileUrl, targetId, targetType } = job.data.metadata;
    const eventName = `file.failed.${targetType}`;
    this.logger.log(
      `Dispatching NestJS event: ${eventName} for target ID: ${targetId}`,
    );
    this.eventEmitter.emit(eventName, {
      targetId,
      fileUrl,
      jobId: job.id,
    });
  }
}
