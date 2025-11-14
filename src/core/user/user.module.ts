import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from './entities/user.entity';
import { Address } from './entities/address.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module';
import { BlackListModule } from './black-list/black-list.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Address]),
    InfrastructureModule,
    BlackListModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService, BlackListModule],
})
export class UserModule {}
