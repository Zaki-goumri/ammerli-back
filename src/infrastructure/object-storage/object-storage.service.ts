import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import {
  from,
  of,
  throwError,
  Observable,
  forkJoin,
  lastValueFrom,
} from 'rxjs';
import { map, catchError, retry, mergeMap, tap } from 'rxjs/operators';
import { UploadingOptions } from './types/upload-options.interface';
import {
  ObjectStorageService,
  FileData,
  SerializedBuffer,
} from './object-storage.interface';
import { ConfigType } from '@nestjs/config';
import { MINIO_CLIENT, MINIO_PUBLIC_CLIENT } from '../minio/minio.module';
import * as Minio from 'minio';
import * as crypto from 'crypto';
import minioConfig from 'src/config/minio.config';

interface UploadResult {
  message: string;
  fileUrl: string;
  objectName: string;
  error?: boolean;
}

@Injectable()
export class ObjectService implements ObjectStorageService {
  private readonly logger = new Logger(ObjectService.name);
  private readonly defaultBucket: string;
  private readonly MAX_RETRIES = 3;

  constructor(
    @Inject(minioConfig.KEY)
    private readonly config: ConfigType<typeof minioConfig>,
    @Inject(MINIO_CLIENT)
    private readonly minioClient: Minio.Client,
    @Inject(MINIO_PUBLIC_CLIENT)
    private readonly minioPublicClient: Minio.Client,
  ) {
    this.defaultBucket = this.config.bucket;
  }

  async uploadFile(
    file: FileData,
    options?: UploadingOptions,
  ): Promise<{ message: string; fileUrl: string; objectName: string }> {
    if (!file || !file.buffer) {
      throw new BadRequestException('File buffer is missing.');
    }

    const fileBuffer = this.normalizeFileBuffer(file.buffer);

    const bucketName = options?.bucketName ?? this.defaultBucket;
    const objectName =
      options?.objectName || this.generateUniqueObjectName(file.originalname);

    const metaData = {
      'Content-Type': file.mimetype,
      'X-Amz-Meta-Original-Name': encodeURIComponent(file.originalname),
    };

    const uploadOperation$ = from(
      this.minioClient.putObject(
        bucketName,
        objectName,
        fileBuffer,
        file.size,
        metaData,
      ),
    ).pipe(
      mergeMap(() =>
        from(this.getPresignedUrl(objectName, bucketName)).pipe(
          map((fileUrl) => ({
            message: 'File uploaded to MinIO successfully.',
            fileUrl,
            objectName,
          })),
        ),
      ),
      retry(this.MAX_RETRIES),
      catchError((error) => {
        this.logger.error(
          `Upload failed after ${this.MAX_RETRIES} retries for ${objectName}: ${error.message}`,
        );
        return throwError(
          () => new BadRequestException('Failed to upload file to MinIO.'),
        );
      }),
      tap({
        next: () =>
          this.logger.log(`File uploaded successfully: ${objectName}`),
        error: (error) =>
          this.logger.error(
            `Final upload failure for ${objectName}: ${error.message}`,
          ),
      }),
    );

    return lastValueFrom(uploadOperation$);
  }

  async uploadBulkFiles(
    files: FileData[],
    options?: UploadingOptions,
  ): Promise<Array<{ message: string; fileUrl: string; objectName: string }>> {
    this.logger.log(`Starting bulk upload of ${files.length} files`);

    const uploadObservables = files.map((file, index) =>
      this.createUploadOperation(file, options, index).pipe(
        catchError((error) => {
          this.logger.error(
            `Failed to upload file ${file.originalname}: ${error.message}`,
          );
          return of({
            message: `Failed to upload file: ${error.message}`,
            fileUrl: '',
            objectName: '',
            error: true,
          } as UploadResult);
        }),
      ),
    );

    const results$ = forkJoin(uploadObservables).pipe(
      map((results: UploadResult[]) => {
        const successful = results.filter((result) => !result.error);
        const failed = results.filter((result) => result.error);

        this.logger.log(
          `Bulk upload completed: ${successful.length} successful, ${failed.length} failed`,
        );

        return results.filter((result) => !result.error);
      }),
    );

    return lastValueFrom(results$);
  }

  private createUploadOperation(
    file: FileData,
    options?: UploadingOptions,
    index?: number,
  ): Observable<UploadResult> {
    const fileBuffer = this.normalizeFileBuffer(file.buffer);

    const bucketName = options?.bucketName ?? this.defaultBucket;
    const objectName =
      options?.objectName || this.generateUniqueObjectName(file.originalname);

    const metaData = {
      'Content-Type': file.mimetype,
      'X-Amz-Meta-Original-Name': encodeURIComponent(file.originalname),
    };

    return from(
      this.minioClient.putObject(
        bucketName,
        objectName,
        fileBuffer,
        file.size,
        metaData,
      ),
    ).pipe(
      mergeMap(() =>
        from(this.getPresignedUrl(objectName, bucketName)).pipe(
          map((fileUrl) => ({
            message: 'File uploaded to MinIO successfully.',
            fileUrl,
            objectName,
          })),
        ),
      ),
      retry(this.MAX_RETRIES),
      catchError((error) => {
        this.logger.error(
          `Upload failed for ${objectName} after ${this.MAX_RETRIES} retries`,
        );
        return throwError(
          () =>
            new BadRequestException(
              `Failed to upload file ${file.originalname} to MinIO.`,
            ),
        );
      }),
      tap({
        next: () =>
          this.logger.log(
            `Successfully uploaded file ${index !== undefined ? `#${index + 1}` : ''}: ${objectName}`,
          ),
        error: (error) =>
          this.logger.error(
            `Final upload failure for ${objectName}: ${error.message}`,
          ),
      }),
    );
  }

  // Helper method to normalize buffer data
  private normalizeFileBuffer(bufferData: Buffer | SerializedBuffer): Buffer {
    if (Buffer.isBuffer(bufferData)) {
      return bufferData;
    } else {
      const serializedBuffer = bufferData as SerializedBuffer;
      if (
        serializedBuffer.type === 'Buffer' &&
        Array.isArray(serializedBuffer.data)
      ) {
        return Buffer.from(serializedBuffer.data);
      } else {
        this.logger.error(
          'Received file buffer in an unexpected format.',
          bufferData,
        );
        throw new BadRequestException('File buffer is corrupted or invalid.');
      }
    }
  }

  async deleteFile(objectName: string, bucketName: string): Promise<void> {
    this.logger.log(
      `Attempting to delete object: ${objectName} from bucket ${bucketName}`,
    );

    const delete$ = from(
      this.minioClient.removeObject(bucketName, objectName),
    ).pipe(
      retry(this.MAX_RETRIES),
      catchError((error) => {
        this.logger.error(
          `Delete failed after ${this.MAX_RETRIES} retries for ${objectName}: ${error.message}`,
        );
        return throwError(
          () =>
            new InternalServerErrorException(
              `Failed to delete file ${objectName}.`,
            ),
        );
      }),
      tap(() => this.logger.log(`Successfully deleted object: ${objectName}`)),
    );

    await lastValueFrom(delete$);
  }

  async deleteBulkFiles(
    files: { objectName: string; bucketName: string }[],
  ): Promise<void> {
    this.logger.log(`Attempting to delete ${files.length} files in bulk.`);

    const deleteObservables = files.map((file) =>
      from(
        this.minioClient.removeObject(file.bucketName, file.objectName),
      ).pipe(
        retry(this.MAX_RETRIES),
        catchError((error) => {
          this.logger.error(
            `Failed to delete ${file.objectName}: ${error.message}`,
          );
          return of({ success: false, objectName: file.objectName, error });
        }),
        map(() => ({ success: true, objectName: file.objectName })),
        tap({
          next: (result) => {
            if (result.success) {
              this.logger.log(`Successfully deleted: ${result.objectName}`);
            }
          },
          error: (error) =>
            this.logger.error(
              `Final deletion failure for ${file.objectName}: ${error.message}`,
            ),
        }),
      ),
    );

    const results$ = forkJoin(deleteObservables).pipe(
      tap((results) => {
        const successful = results.filter((r) => r.success);
        const failed = results.filter((r) => !r.success);

        this.logger.log(
          `Bulk deletion completed: ${successful.length} successful, ${failed.length} failed`,
        );

        if (failed.length > 0) {
          this.logger.warn(
            `Failed to delete: ${failed.map((f) => f.objectName).join(', ')}`,
          );
        }
      }),
    );

    await lastValueFrom(results$);
  }

  async getPresignedUrl(
    objectName: string,
    bucketName: string,
  ): Promise<string> {
    if (!objectName) {
      return '';
    }
    try {
      const presignedUrl = await this.minioPublicClient.presignedGetObject(
        bucketName,
        objectName,
        7 * 24 * 60 * 60, // 7 days
      );

      this.logger.log(
        `Generated presigned URL for ${objectName}: ${presignedUrl}`,
      );
      return presignedUrl;
    } catch (error) {
      this.logger.error(
        `Failed to generate presigned URL for ${objectName} in bucket ${bucketName}: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Failed to generate presigned URL.',
      );
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
        `Failed to get file ${objectName} from MinIO in bucket ${bucketName}: ${error.message}`,
      );
      throw new InternalServerErrorException('Failed to retrieve file.');
    }
  }

  getFileNameFromUrl(url: string): string {
    try {
      const parsedUrl = new URL(url);
      const pathParts = parsedUrl.pathname.split('/');
      return pathParts[pathParts.length - 1] || '';
    } catch (error) {
      const pathParts = url.split('/');
      return pathParts[pathParts.length - 1] || '';
    }
  }

  generateUniqueObjectName(originalName: string): string {
    const timestamp = Date.now();
    const randomBytes = crypto.randomBytes(6).toString('hex');
    const sanitizedOriginalName = originalName.replace(/\s+/g, '_');
    return `${timestamp}-${randomBytes}-${sanitizedOriginalName}`;
  }
}
