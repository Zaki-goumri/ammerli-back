import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import dbConfig from 'src/config/db.config';

@Module({
  imports: [TypeOrmModule.forRootAsync(dbConfig.asProvider())],
})
export class DbModule {}
