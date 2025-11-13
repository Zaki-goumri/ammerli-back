import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { BlackListController } from './black-list.controller';
import { BlackListService } from './black-list.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [BlackListController],
  providers: [BlackListService],
  exports: [BlackListService],
})
export class BlackListModule {}
