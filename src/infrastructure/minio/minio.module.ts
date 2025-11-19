import { Module } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import * as Minio from 'minio';
import minioConfig from 'src/config/minio.config';

export const MINIO_CLIENT = 'MINIO_CLIENT';

const minioClientProvider = {
  provide: MINIO_CLIENT,
  useFactory: (config: ConfigType<typeof minioConfig>) => {
    const client = new Minio.Client({
      endPoint: config.endPoint,
      port: config.port,
      accessKey: config.accessKey,
      secretKey: config.secretKey,
      region: config.region,
      useSSL: config.useSSL,
    });
    return client;
  },
  inject: [minioConfig.KEY],
};

@Module({
  imports: [],
  providers: [minioClientProvider],
  exports: [MINIO_CLIENT],
})
export class MinioModule {}
