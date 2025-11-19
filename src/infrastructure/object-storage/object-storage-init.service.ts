import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import {
  STORAGE_INITIALIZER,
  StorageInitializer,
} from './initializers/storage-initializer.interface';

@Injectable()
export class ObjectStorageInitService implements OnModuleInit {
  constructor(
    @Inject(STORAGE_INITIALIZER)
    private readonly storageInitializer: StorageInitializer,
  ) {}

  async onModuleInit() {
    await this.storageInitializer.initialize();
  }
}
