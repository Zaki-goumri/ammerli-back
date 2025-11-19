import { Global, Module } from '@nestjs/common';
import { ObjectService } from './object-storage.service';
import { MinioModule } from '../minio/minio.module';
import { STORAGE_INITIALIZER } from './initializers/storage-initializer.interface';
import { MinioInitializerService } from './initializers/minio-initializer.service';
import { ObjectStorageInitService } from './object-storage-init.service';

@Global()
@Module({
  imports: [MinioModule],
  providers: [
    ObjectService,
    ObjectStorageInitService,
    {
      provide: STORAGE_INITIALIZER,
      useClass: MinioInitializerService,
    },
  ],
  exports: [ObjectService, MinioModule],
})
export class ObjectStorageModule {}
