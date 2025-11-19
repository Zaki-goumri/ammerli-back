// object-storage.interface.ts
import { UploadingOptions } from './types/upload-options.interface';

export interface SerializedBuffer {
  type: 'Buffer';
  data: number[];
}

export interface FileData {
  buffer: Buffer | SerializedBuffer;
  originalname: string;
  mimetype: string;
  size: number;
}

export interface ObjectStorageService {
  uploadFile(
    file: FileData,
    options?: UploadingOptions,
  ): Promise<{ message: string; fileUrl: string; objectName: string }>;

  deleteFile(objectName: string, bucketName: string): Promise<void>;

  deleteBulkFiles(
    files: { objectName: string; bucketName: string }[],
  ): Promise<void>;

  getPresignedUrl(objectName: string, bucketName: string): Promise<string>;

  getFile(objectName: string, bucketName: string): Promise<Buffer>;

  uploadBulkFiles(
    files: FileData[],
    options?: UploadingOptions,
  ): Promise<Array<{ message: string; fileUrl: string; objectName: string }>>;

  getFileUrl(fileName: string, bucketName: string): string;

  getFileNameFromUrl(url: string): string;
}
