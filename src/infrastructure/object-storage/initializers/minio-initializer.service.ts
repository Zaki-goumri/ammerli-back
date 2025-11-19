import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import * as Minio from 'minio';
import minioConfig from 'src/config/minio.config';
import { MINIO_CLIENT } from '../../minio/minio.module';
import { StorageInitializer } from './storage-initializer.interface';

@Injectable()
export class MinioInitializerService implements StorageInitializer {
  private readonly logger = new Logger(MinioInitializerService.name);

  constructor(
    @Inject(minioConfig.KEY)
    private readonly config: ConfigType<typeof minioConfig>,
    @Inject(MINIO_CLIENT)
    private readonly minioClient: Minio.Client,
  ) {}

  async initialize(): Promise<void> {
    const bucketNames = [this.config.bucket, ...this.config.buckets];
    for (const bucketName of bucketNames) {
      await this.ensureBucketExists(bucketName);
    }
  }

  private async ensureBucketExists(bucketName: string): Promise<void> {
    try {
      const exists = await this.minioClient.bucketExists(bucketName);
      if (exists) {
        this.logger.log(`Bucket '${bucketName}' already exists`);
        return;
      }
      this.logger.log(`Creating bucket '${bucketName}'...`);
      await this.minioClient.makeBucket(bucketName, 'us-east-1');
      this.logger.log(`Bucket '${bucketName}' created successfully`);
    } catch (error) {
      this.logger.error(
        `Failed to ensure bucket '${bucketName}' exists`,
        error.stack,
      );
      throw error;
    }
  }
}
