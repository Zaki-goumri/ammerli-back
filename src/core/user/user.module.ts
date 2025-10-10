import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from './entities/user.entity';
import { Address } from './entities/address.entity';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { UserRepository } from './repositories/user.repository';

@Module({
  imports: [MikroOrmModule.forFeature([User, Address])],
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserService],
})
export class UserModule {}
