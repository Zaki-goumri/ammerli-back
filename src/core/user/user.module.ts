import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from './entities/user.entity';
import { Address } from './entities/address.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueueModule } from 'src/infrastructure/queue/queue.module';
import { ObjectStorageModule } from 'src/infrastructure/object-storage/object-storage.module';
import { BlackListModule } from './black-list/black-list.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Address]),
    QueueModule,
    ObjectStorageModule,
    forwardRef(() => BlackListModule),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
