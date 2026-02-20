import { Global, Module } from '@nestjs/common';
import { LoggerBuilder } from './logger.builder';
import { ClsService } from 'nestjs-cls';

@Global()
@Module({
  providers: [
    {
      provide: 'LoggerService',
      useFactory: (cls: ClsService) => {
        return new LoggerBuilder(cls)
          .setJobName(process.env.APP_NAME || 'ammerli-backend')
          .setEnvironment(process.env.NODE_ENV || 'dev')
          .build();
      },
    },
  ],
  exports: ['LoggerService'],
})
export class LoggerModule {}
