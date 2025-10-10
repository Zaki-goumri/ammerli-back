import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import dbConfig from 'src/config/db.config';

@Module({
  imports: [MikroOrmModule.forRootAsync(dbConfig.asProvider())],
})
export class DbModule {}
