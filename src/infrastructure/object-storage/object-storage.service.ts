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
    file: Express.Multer.File,
    options?: UploadingOptions,
  ): Promise<{ message: string; fileUrl: string }> {
    if (!file || !file.buffer) {
      throw new BadRequestException('File buffer is missing.');
    }
    let fileBuffer: Buffer;
    if (Buffer.isBuffer(file.buffer)) {
      fileBuffer = file.buffer;
    } else {
      const serializedBuffer = file.buffer as SerializedBuffer;
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
    const fileName =
      options?.objectName || this.generateUniqueObjectName(file.originalname);

    const metaData = {
      'Content-Type': file.mimetype,
      'X-Amz-Meta-Original-Name': encodeURIComponent(file.originalname),
    };
    try {
      await this.minioClient.putObject(
        options?.bucketName ?? this.bucketName,
        fileName,
        fileBuffer,
        file.size,
        metaData,
      );

      const fileUrl = this.getFileUrl(fileName);
      this.logger.log(`File uploaded successfully: ${fileUrl}`);
      return {
        message: 'File uploaded to MinIO successfully.',
        fileUrl,
      };
    } catch (error) {
      this.logger.error(`Error uploading file to MinIO: ${error.message}`);
      throw new BadRequestException('Failed to upload file to MinIO.');
    }
  }

  async deleteFile(objectName: string): Promise<void> {
    this.logger.log(
      `Attempting to delete object: ${objectName} from bucket ${this.bucketName}`,
    );

    try {
      await this.minioClient.removeObject(this.bucketName, objectName);
      this.logger.log(`Successfully deleted object: ${objectName}`);
    } catch (error) {
      this.logger.error(
        `MinIO deletion failed for object ${objectName}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to delete file from object storage.',
      );
    }
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

  // async getPresignedUploadUrl(
  //   objectName: string,
  //   expirySeconds: number = 60 * 5,
  // ): Promise<string> {
  //   this.logger.log(`Generating presigned PUT URL for object: ${objectName}`);
  //   const bucketName = this.bucketName;
  //   return await this.minioClient.presignedPutObject(
  //     bucketName,
  //     objectName,
  //     expirySeconds,
  //   );
  // }
}
