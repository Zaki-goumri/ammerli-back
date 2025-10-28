import { DynamicModule, Module, Provider } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { FirebaseProvider } from './firebase.provider';
import { FirebaseModuleAsyncOptions } from './firebase.interface';
import { FIREBASE_OPTIONS } from './firebase.constants';

@Module({})
export class FirebaseModule {
  static forRootAsync(options: FirebaseModuleAsyncOptions): DynamicModule {
    const optionsProvider: Provider = {
      provide: FIREBASE_OPTIONS,
      useFactory: options.useFactory,
      inject: options.inject,
    };

    return {
      module: FirebaseModule,
      imports: options.imports,
      providers: [FirebaseService, FirebaseProvider, optionsProvider],
      global: true,
      exports: [FirebaseService, FirebaseProvider, optionsProvider],
    };
  }
}
