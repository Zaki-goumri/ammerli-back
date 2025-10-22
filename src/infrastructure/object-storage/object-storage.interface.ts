import { UploadingOptions } from './types/upload-options.interface';

export interface ObjectStorageService {
  uploadFile(
    file: Express.Multer.File,
    options?: UploadingOptions,
  ): Promise<{ message: string; fileUrl: string }>;
  deleteFile(fileUrl: string): Promise<void>;
}
