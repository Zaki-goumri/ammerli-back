import { Module, DynamicModule } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigType } from '@nestjs/config';
import {
  ConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN,
  OPTIONS_TYPE,
  ASYNC_OPTIONS_TYPE,
} from './module.builder';
import { ChargiliService } from './chargili.service';
import { ChargilyClientOptions } from './interfaces/data';
import { CHARGILY_LIVE_URL, CHARGILY_TEST_URL } from './constants';

@Module({})
export class ChargiliModule extends ConfigurableModuleClass {
  /**
   * Registers the module synchronously with the provided options.
   * @param {typeof OPTIONS_TYPE} options - The configuration options for the module.
   * @returns {DynamicModule} The configured dynamic module.
   */
  static register(options: typeof OPTIONS_TYPE): DynamicModule {
    return {
      module: ChargiliModule,
      imports: [
        HttpModule.register({
          baseURL:
            options.mode === 'test'
              ? `${CHARGILY_TEST_URL}${options.version ?? 'v2'}`
              : `${CHARGILY_LIVE_URL}${options.version ?? 'v2'}`,
          headers: {
            Authorization: `Bearer ${options.api_key}`,
            'Content-Type': 'application/json',
          },
        }),
      ],
      providers: [
        {
          provide: MODULE_OPTIONS_TOKEN,
          useValue: options,
        },
        ChargiliService,
      ],
      exports: [ChargiliService],
    };
  }

  /**
   * Registers the module asynchronously with the provided options.
   * @param {typeof ASYNC_OPTIONS_TYPE} options - The asynchronous configuration options for the module.
   * @returns {DynamicModule} The configured dynamic module.
   */
  static registerAsync(options: typeof ASYNC_OPTIONS_TYPE): DynamicModule {
    const httpModuleOptions = {
      imports: options.imports,
      useFactory: async (...args: any[]) => {
        let config: ChargilyClientOptions;

        if (options.useFactory) {
          config = await options.useFactory(...args);
        } else if (options.useClass) {
          throw new Error('useClass is not supported yet');
        } else if (options.useExisting) {
          throw new Error('useExisting is not supported yet');
        } else {
          throw new Error('No configuration factory provided');
        }

        return {
          baseURL:
            config.mode === 'test'
              ? `${CHARGILY_TEST_URL}${config.version ?? 'v2'}`
              : `${CHARGILY_LIVE_URL}${config.version ?? 'v2'}`,
          headers: {
            Authorization: `Bearer ${config.api_key}`,
            'Content-Type': 'application/json',
          },
        };
      },
      inject: options.inject,
    };

    const providers: any[] = [ChargiliService];

    if (options.useFactory) {
      providers.push({
        provide: MODULE_OPTIONS_TOKEN,
        useFactory: options.useFactory,
        inject: options.inject || [],
      });
    } else if (options.useClass) {
      providers.push({
        provide: MODULE_OPTIONS_TOKEN,
        useClass: options.useClass,
      });
    } else if (options.useExisting) {
      providers.push({
        provide: MODULE_OPTIONS_TOKEN,
        useExisting: options.useExisting,
      });
    }

    return {
      module: ChargiliModule,
      imports: [
        ...(options.imports || []),
        HttpModule.registerAsync(httpModuleOptions),
      ],
      providers,
      exports: [ChargiliService],
    };
  }

  /**
   * Registers the module asynchronously using a configuration provider from `@nestjs/config`.
   * @param {ReturnType<typeof import('@nestjs/config').registerAs>} configProvider - The configuration provider.
   * @returns {DynamicModule} The configured dynamic module.
   */
  static forRootAsync(
    configProvider: ReturnType<typeof import('@nestjs/config').registerAs>,
  ): DynamicModule {
    return {
      module: ChargiliModule,
      imports: [
        ConfigModule.forFeature(configProvider),
        HttpModule.registerAsync({
          imports: [ConfigModule.forFeature(configProvider)],
          useFactory: async (config: ConfigType<typeof configProvider>) => {
            return {
              baseURL:
                config.mode === 'test'
                  ? `${CHARGILY_TEST_URL}${config.version ?? 'v2'}`
                  : `${CHARGILY_LIVE_URL}${config.version ?? 'v2'}`,
              headers: {
                Authorization: `Bearer ${config.api_key}`,
                'Content-Type': 'application/json',
              },
            };
          },
          inject: [configProvider.KEY],
        }),
      ],
      providers: [
        {
          provide: MODULE_OPTIONS_TOKEN,
          useFactory: (config: ConfigType<typeof configProvider>) => config,
          inject: [configProvider.KEY],
        },
        ChargiliService,
      ],
      exports: [ChargiliService],
    };
  }
}
