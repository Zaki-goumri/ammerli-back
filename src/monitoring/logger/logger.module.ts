import { Global, Module } from '@nestjs/common';
import { LoggerBuilder } from './logger.builder';

@Global()
@Module({
  providers: [
    {
      provide: 'LoggerService',
      useFactory: () => {
        return new LoggerBuilder()
          .setJobName(process.env.APP_NAME || 'ammerli-backend')
          .setEnvironment(process.env.NODE_ENV || 'dev')
          .build();
      },
    },
  ],
  exports: ['LoggerService'],
})
export class LoggerModule {}
