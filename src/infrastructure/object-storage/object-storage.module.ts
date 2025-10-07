import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import cloudConfig from 'src/config/cloud.config';
import { CloudinaryService } from './object-storage.service';
@Module({
  imports: [ConfigModule.forFeature(cloudConfig)],
  providers: [{ provide: 'ObjectStorage', useClass: CloudinaryService }],
  exports: ['ObjectStorage'],
})
export class ObjectStorageModule {}
