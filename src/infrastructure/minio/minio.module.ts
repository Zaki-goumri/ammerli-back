import { Module } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import * as Minio from 'minio';
import minioConfig from 'src/config/minio.config';

export const MINIO_CLIENT = 'MINIO_CLIENT';
export const MINIO_PUBLIC_CLIENT = 'MINIO_PUBLIC_CLIENT';

const minioClientProvider = {
  provide: MINIO_CLIENT,
  useFactory: (config: ConfigType<typeof minioConfig>) => {
    return new Minio.Client({
      endPoint: config.endPoint,
      port: config.port,
      accessKey: config.accessKey,
      secretKey: config.secretKey,
      region: config.region,
      useSSL: false,
    });
  },
  inject: [minioConfig.KEY],
};

const minioPublicClientProvider = {
  provide: MINIO_PUBLIC_CLIENT,
  useFactory: (config: ConfigType<typeof minioConfig>) => {
    return new Minio.Client({
      endPoint: config.publicUrl,
      port: 433,
      accessKey: config.accessKey,
      secretKey: config.secretKey,
      region: config.region,
      useSSL: true,
    });
  },
  inject: [minioConfig.KEY],
};

@Module({
  imports: [],
  providers: [minioClientProvider, minioPublicClientProvider],
  exports: [MINIO_CLIENT, MINIO_PUBLIC_CLIENT],
})
export class MinioModule {}
