import { Module } from '@nestjs/common';
import { ObjectService } from './object-storage.service';
import { MinioModule } from '../minio/minio.module';

@Module({
  imports: [MinioModule],
  providers: [ObjectService],
  exports: [ObjectService],
})
export class ObjectStorageModule {}
