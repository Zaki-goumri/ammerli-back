import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import * as Minio from 'minio';
import minioConfig from 'src/config/minio.config';

export const MINIO_CLIENT = 'MINIO_CLIENT';

const minioClientProvider = {
  provide: MINIO_CLIENT,
  useFactory: (config: ConfigType<typeof minioConfig>) => {
    return new Minio.Client({
      endPoint: config.endPoint,
      port: config.port,
      accessKey: config.accessKey,
      secretKey: config.secretKey,
      useSSL: config.useSSL,
    });
  },
  inject: [minioConfig.KEY],
};

@Module({
  imports: [],
  providers: [minioClientProvider],
  exports: [MINIO_CLIENT],
})
export class MinioModule {}
