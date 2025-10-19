import { Injectable, Logger } from '@nestjs/common';
import 'multer';
import { UploadingOptions } from './types/upload-options.interface';
import { ObjectStorageMethods } from './object-storage.interface';

@Injectable()
export class MinioService implements ObjectStorageMethods {
  private readonly logger = new Logger(MinioService.name);

  constructor() {}

  async uploadFile(
    file: Express.Multer.File,
    options?: UploadingOptions,
  ): Promise<{ message: string; fileUrl: string }> {
    this.logger.log(`Uploading file to MinIO: ${file.originalname}`);
    return {
      message: 'File uploaded to MinIO (mock)',
      fileUrl: file.originalname,
    };
  }

  async deleteFile(fileUrl: string): Promise<void> {
    this.logger.log(`Deleting file from MinIO: ${fileUrl}`);
  }
}
