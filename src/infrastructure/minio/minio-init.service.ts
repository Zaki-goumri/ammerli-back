import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import * as Minio from 'minio';
import minioConfig from 'src/config/minio.config';
import { MINIO_CLIENT } from './minio.module';

@Injectable()
export class MinioInitService implements OnModuleInit {
  private readonly logger = new Logger(MinioInitService.name);

  constructor(
    @Inject(minioConfig.KEY)
    private readonly config: ConfigType<typeof minioConfig>,
    @Inject(MINIO_CLIENT)
    private readonly minioClient: Minio.Client,
  ) {}

  async onModuleInit() {
    await this.ensureBucketExists();
  }

  private async ensureBucketExists(): Promise<void> {
    const bucketName = this.config.bucket;

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
