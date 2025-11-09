import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from './entities/user.entity';
import { Address } from './entities/address.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlackListModule } from './black-list/black-list.module';
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Address]),
    forwardRef(() => InfrastructureModule),
    forwardRef(() => BlackListModule),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
