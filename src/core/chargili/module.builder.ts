import { ConfigurableModuleBuilder } from '@nestjs/common';
import { ChargilyClientOptions } from './interfaces';

export const {
  ConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN,
  OPTIONS_TYPE,
  ASYNC_OPTIONS_TYPE,
} = new ConfigurableModuleBuilder<ChargilyClientOptions>().build();
