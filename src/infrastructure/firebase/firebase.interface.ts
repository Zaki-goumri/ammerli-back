import { ModuleMetadata } from '@nestjs/common/interfaces';

export interface FirebaseOptions {
  serviceAccountPath: string;
}

export interface FirebaseModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  useFactory: (...args: any[]) => Promise<FirebaseOptions> | FirebaseOptions;
  inject: any[];
  providers?: any[];
}
