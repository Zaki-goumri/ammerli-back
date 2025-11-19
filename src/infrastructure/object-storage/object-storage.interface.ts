import { UploadingOptions } from './types/upload-options.interface';

export interface ObjectStorageService {
  uploadFile(
    file: Express.Multer.File,
    options?: UploadingOptions,
  ): Promise<{ message: string; fileUrl: string; objectName: string }>;
  deleteFile(objectName: string, bucketName: string): Promise<void>;
  deleteBulkFiles(
    files: { objectName: string; bucketName: string }[],
  ): Promise<void>;
  getPresignedUrl(objectName: string, bucketName: string): Promise<string>;
  getFile(objectName: string, bucketName: string): Promise<Buffer>;
}
