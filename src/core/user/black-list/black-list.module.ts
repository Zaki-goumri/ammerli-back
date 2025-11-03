import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user.module';
import { BlackListController } from './black-list.controller';
import { BlackList } from './entities/black-list.entity';
import { BlackListService } from './black-list.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([BlackList]),
    forwardRef(() => UserModule),
  ],
  controllers: [BlackListController],
  providers: [BlackListService],
  exports: [BlackListService],
})
export class BlackListModule {}
