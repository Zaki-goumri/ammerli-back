import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import cloudConfig from 'src/config/cloud.config';
import { MinioService } from './object-storage.service';
@Module({
  imports: [ConfigModule.forFeature(cloudConfig)],
  providers: [{ provide: 'ObjectStorage', useClass: MinioService }],
  exports: ['ObjectStorage'],
})
export class ObjectStorageModule {}
