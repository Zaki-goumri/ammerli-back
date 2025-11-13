import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import 'multer';
import { UploadingOptions } from './types/upload-options.interface';
import { ObjectStorageService } from './object-storage.interface';
import { ConfigType } from '@nestjs/config';
import { MINIO_CLIENT } from '../minio/minio.module';
import * as Minio from 'minio';
import * as crypto from 'crypto';
import minioConfig from 'src/config/minio.config';

interface SerializedBuffer {
  type: 'Buffer';
  data: number[];
}

@Injectable()
export class ObjectService implements ObjectStorageService {
  private readonly logger = new Logger(ObjectService.name);
  private readonly bucketName = this.config.bucket;

  constructor(
    @Inject(minioConfig.KEY)
    private readonly config: ConfigType<typeof minioConfig>,
    @Inject(MINIO_CLIENT)
    private readonly minioClient: Minio.Client,
  ) {}

  async uploadFile(
    file: {
      buffer: Buffer | SerializedBuffer;
      originalname: string;
      mimetype: string;
      size: number;
    },
    options?: UploadingOptions,
  ): Promise<{ message: string; fileUrl: string; objectName: string }> {
    if (!file || !file.buffer) {
      throw new BadRequestException('File buffer is missing.');
    }
    let fileBuffer: Buffer;
    if (Buffer.isBuffer(file.buffer)) {
      fileBuffer = file.buffer;
    } else {
      const serializedBuffer = file.buffer;
      if (
        serializedBuffer.type == 'Buffer' &&
        Array.isArray(serializedBuffer.data)
      ) {
        fileBuffer = Buffer.from(serializedBuffer.data);
      } else {
        this.logger.error(
          'Received file buffer in an unexpected format.',
          file.buffer,
        );
        throw new BadRequestException('File buffer is corrupted or invalid.');
      }
    }
    this.logger.log(
      `Uploading file to MinIO: ${file.originalname} in bucket ${this.bucketName}`,
    );
    const objectName =
      options?.objectName || this.generateUniqueObjectName(file.originalname);

    const metaData = {
      'Content-Type': file.mimetype,
      'X-Amz-Meta-Original-Name': encodeURIComponent(file.originalname),
    };
    try {
      await this.minioClient.putObject(
        options?.bucketName ?? this.bucketName,
        objectName,
        fileBuffer,
        file.size,
        metaData,
      );

      const fileUrl = this.getFileUrl(objectName);
      this.logger.log(`File uploaded successfully: ${fileUrl}`);
      return {
        message: 'File uploaded to MinIO successfully.',
        fileUrl,
        objectName,
      };
    } catch (error) {
      this.logger.error(`Error uploading file to MinIO: ${error}`);
      throw new BadRequestException('Failed to upload file to MinIO.');
    }
  }

  async deleteFile(objectUrl: string): Promise<void> {
    try {
      const objectName = this.getFileNameFromUrl(objectUrl);
      this.logger.log(
        `Attempting to delete object: ${objectName} from bucket ${this.bucketName}`,
      );
      await this.minioClient.removeObject(this.bucketName, objectName);
      this.logger.log(`Successfully deleted object: ${objectName}`);
    } catch (error) {
      this.logger.error(
        `MinIO deletion failed for object ${objectUrl}: ${error.message}`,
        error.stack,
      );
    }
  }

  async deleteBulkFiles(objectUrls: string[]): Promise<void> {
    this.logger.log(`Attempting to delete ${objectUrls.length} files in bulk.`);
    await Promise.allSettled(objectUrls.map((url) => this.deleteFile(url)));
    this.logger.log('Bulk file deletion process completed.');
  }

  generateUniqueObjectName(originalName: string): string {
    const timestamp = Date.now();
    const randomBytes = crypto.randomBytes(6).toString('hex');
    const sanitizedOriginalName = originalName.replace(/\s+/g, '_');
    return `${timestamp}-${randomBytes}-${sanitizedOriginalName}`;
  }

  getFileUrl(fileName: string): string {
    const publicHost = this.config.publicUrl;
    const protocol = this.config.useSSL ? 'http' : 'http';
    return `${protocol}://${publicHost}/${this.bucketName}/${fileName}`;
  }

  async getPresignedUrl(objectName: string): Promise<string> {
    if (!objectName) {
      return '';
    }

    try {
      const presignedUrl = await this.minioClient.presignedGetObject(
        this.bucketName,
        objectName,
        7 * 24 * 60 * 60, // 7 days
      );

      const publicHost = this.config.publicUrl;
      const customBase = 'https://' + publicHost + '/' + this.bucketName;
      const cleanUrl = presignedUrl.replace(
        /https?:\/\/minio:9000\/[^/]+/,
        customBase,
      );

      return cleanUrl;
    } catch (error) {
      this.logger.error(
        `Failed to generate presigned URL for ${objectName}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to generate presigned URL.',
      );
    }
  }

  async uploadBulkFiles(
    files: Array<{
      buffer: Buffer | SerializedBuffer;
      originalname: string;
      mimetype: string;
      size: number;
    }>,
    options?: UploadingOptions,
  ): Promise<Array<{ message: string; fileUrl: string; objectName: string }>> {
    const uploadPromises = files.map((file) => this.uploadFile(file, options));
    return Promise.all(uploadPromises);
  }

  getFileNameFromUrl(url: string): string {
    return url.split('/').pop() || '';
  }

  async getFile(objectName: string): Promise<Buffer> {
    try {
      const stream = await this.minioClient.getObject(
        this.bucketName,
        objectName,
      );
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk as Buffer);
      }
      return Buffer.concat(chunks);
    } catch (error) {
      this.logger.error(
        `Failed to get file ${objectName} from MinIO`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to retrieve file.');
    }
  }
}
