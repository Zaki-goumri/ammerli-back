import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { UPLOAD_JOBS } from 'src/common/constants/jobs';
import { QUEUE_NAME } from 'src/common/constants/queues';
import { UploadJobDto } from './dto/upload-job.dto';
import { ObjectService } from '../../object-storage/object-storage.service';
import { Logger } from '@nestjs/common';
import { FinalizePayloadDto } from './dto/finalize-payload.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DeleteFileDto } from './dto/delete-file.dto';
import { DeleteFilesBulkDto } from './dto/delete-files-bulk.dto';
import { UploadFilesBulkDto } from './dto/upload-files-bulk.dto';

@Processor(QUEUE_NAME.UPLOAD)
export class UploadProcessor extends WorkerHost {
  constructor(
    private readonly objectStorageService: ObjectService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    super();
  }

  logger = new Logger(UploadProcessor.name);

  async process(
    job: Job<
      UploadJobDto | DeleteFileDto | DeleteFilesBulkDto | UploadFilesBulkDto
    >,
  ): Promise<
    | FinalizePayloadDto
    | { message: string; jobId?: string }
    | FinalizePayloadDto[]
  > {
    switch (job.name) {
      case UPLOAD_JOBS.UPLOAD_FILE:
        this.logger.log(`Processing upload file job: ${job.id}`);
        return this.handleUploading(job.data as UploadJobDto);
      case UPLOAD_JOBS.DELETE_FILE:
        this.logger.log(`Processing delete file job: ${job.id}`);
        const deleteData = job.data as DeleteFileDto;
        await this.objectStorageService.deleteFile(deleteData.objectName);
        return { message: 'File deleted', jobId: job.id };
      case UPLOAD_JOBS.DELETE_FILES_BULK:
        this.logger.log(`Processing bulk delete files job: ${job.id}`);
        const deleteBulkData = job.data as DeleteFilesBulkDto;
        await this.objectStorageService.deleteBulkFiles(
          deleteBulkData.objectUrls,
        );
        return { message: 'Bulk files deleted', jobId: job.id };
      case UPLOAD_JOBS.UPLOAD_FILES_BULK:
        this.logger.log(`Processing bulk upload files job: ${job.id}`);
        return this.handleBulkUploading(job.data as UploadFilesBulkDto);
      default:
        throw new Error('Method not implemented.');
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

  async handleBulkUploading(
    data: UploadFilesBulkDto,
  ): Promise<FinalizePayloadDto[]> {
    this.logger.log('Handling bulk uploading...');
    const results = await this.objectStorageService.uploadBulkFiles(
      data.files,
      data.options,
    );
    this.logger.log('Bulk uploading handled.');
    return results.map((result) => ({
      fileUrl: result.fileUrl,
      targetId: data?.metadata?.targetId ?? 0,
      targetType: data?.metadata?.targetType ?? 'unknown',
    }));
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job completed: ${job.id}`);
    // Handle single file upload completion
    if (job.name === UPLOAD_JOBS.UPLOAD_FILE) {
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
    } else if (job.name === UPLOAD_JOBS.UPLOAD_FILES_BULK) {
      // Handle bulk file upload completion
      const results = job.returnvalue as FinalizePayloadDto[];
      if (results && results.length > 0) {
        const { targetId, targetType } = results[0]; // Assuming same target for all files in bulk
        const eventName = `file.uploaded.bulk.${targetType}`;
        this.logger.log(
          `Dispatching NestJS event: ${eventName} for target ID: ${targetId}`,
        );
        this.eventEmitter.emit(eventName, {
          targetId,
          files: results.map((r) => ({ fileUrl: r.fileUrl, jobId: job.id })),
        });
      }
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job) {
    this.logger.log(`Job failed: ${job.id}`);
    // For single file upload failure
    if (job.name === UPLOAD_JOBS.UPLOAD_FILE) {
      const { targetId, targetType } = job.data.metadata;
      const eventName = `file.failed.${targetType}`;
      this.logger.log(
        `Dispatching NestJS event: ${eventName} for target ID: ${targetId}`,
      );
      this.eventEmitter.emit(eventName, {
        targetId,
        jobId: job.id,
      });
    } else if (job.name === UPLOAD_JOBS.UPLOAD_FILES_BULK) {
      // For bulk file upload failure
      const { metadata } = job.data as UploadFilesBulkDto;
      if (metadata) {
        const { targetId, targetType } = metadata;
        const eventName = `file.failed.bulk.${targetType}`;
        this.logger.log(
          `Dispatching NestJS event: ${eventName} for target ID: ${targetId}`,
        );
        this.eventEmitter.emit(eventName, {
          targetId,
          jobId: job.id,
        });
      }
    }
  }
}
