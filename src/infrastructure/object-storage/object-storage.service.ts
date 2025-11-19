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
  private readonly defaultBucket: string;

  constructor(
    @Inject(minioConfig.KEY)
    private readonly config: ConfigType<typeof minioConfig>,
    @Inject(MINIO_CLIENT)
    private readonly minioClient: Minio.Client,
  ) {
    this.defaultBucket = this.config.bucket;
  }

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
      const serializedBuffer = file.buffer as SerializedBuffer;
      if (
        serializedBuffer.type === 'Buffer' &&
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

    const bucketName = options?.bucketName ?? this.defaultBucket;
    this.logger.log(
      `Uploading file to MinIO: ${file.originalname} in bucket ${bucketName}`,
    );

    const objectName =
      options?.objectName || this.generateUniqueObjectName(file.originalname);

    const metaData = {
      'Content-Type': file.mimetype,
      'X-Amz-Meta-Original-Name': encodeURIComponent(file.originalname),
    };

    try {
      await this.minioClient.putObject(
        bucketName,
        objectName,
        fileBuffer,
        file.size,
        metaData,
      );

      const fileUrl = await this.getPresignedUrl(objectName, bucketName);
      this.logger.log(`File uploaded successfully: ${fileUrl}`);
      return {
        message: 'File uploaded to MinIO successfully.',
        fileUrl,
        objectName,
      };
    } catch (error) {
      this.logger.error(`Error uploading file to MinIO: ${error.message}`, {
        stack: error.stack,
        bucketName,
        objectName,
      });
      throw new BadRequestException('Failed to upload file to MinIO.');
    }
  }

  async deleteFile(objectName: string, bucketName: string): Promise<void> {
    try {
      this.logger.log(
        `Attempting to delete object: ${objectName} from bucket ${bucketName}`,
      );
      await this.minioClient.removeObject(bucketName, objectName);
      this.logger.log(`Successfully deleted object: ${objectName}`);
    } catch (error) {
      this.logger.error(
        `MinIO deletion failed for object ${objectName} in bucket ${bucketName}: ${error.message}`,
        error.stack,
      );
    }
  }

  async deleteBulkFiles(
    files: { objectName: string; bucketName: string }[],
  ): Promise<void> {
    this.logger.log(`Attempting to delete ${files.length} files in bulk.`);
    await Promise.allSettled(
      files.map((file) => this.deleteFile(file.objectName, file.bucketName)),
    );
    this.logger.log('Bulk file deletion process completed.');
  }

  generateUniqueObjectName(originalName: string): string {
    const timestamp = Date.now();
    const randomBytes = crypto.randomBytes(6).toString('hex');
    const sanitizedOriginalName = originalName.replace(/\s+/g, '_');
    return `${timestamp}-${randomBytes}-${sanitizedOriginalName}`;
  }

  getFileUrl(fileName: string, bucketName: string): string {
    const publicHost = this.config.publicUrl;
    const protocol = this.config.useSSL ? 'https' : 'http';
    return `${protocol}://${publicHost}/${bucketName}/${fileName}`;
  }

  async getPresignedUrl(
    objectName: string,
    bucketName: string,
  ): Promise<string> {
    if (!objectName) {
      return '';
    }
    try {
      let presignedUrl = await this.minioClient.presignedGetObject(
        bucketName,
        objectName,
        7 * 24 * 60 * 60, // 7 days
      );

      presignedUrl = presignedUrl.replace(
        /https?:\/\/minio:9000\//,
        'https://storage.ammerli.com/',
      );

      this.logger.log(
        `Generated presigned URL for ${objectName} in bucket ${bucketName}: ${presignedUrl}`,
      );
      return presignedUrl;
    } catch (error) {
      this.logger.error(
        `Failed to generate presigned URL for ${objectName} in bucket ${bucketName}`,
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
    try {
      const parsedUrl = new URL(url);
      const pathParts = parsedUrl.pathname.split('/');
      return pathParts[pathParts.length - 1] || '';
    } catch (error) {
      // Fallback for cases where the input is not a full URL but just a path or object name
      const pathParts = url.split('/');
      return pathParts[pathParts.length - 1] || '';
    }
  }

  async getFile(objectName: string, bucketName: string): Promise<Buffer> {
    try {
      const stream = await this.minioClient.getObject(bucketName, objectName);
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk as Buffer);
      }
      return Buffer.concat(chunks);
    } catch (error) {
      this.logger.error(
        `Failed to get file ${objectName} from MinIO in bucket ${bucketName}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to retrieve file.');
    }
  }
}
