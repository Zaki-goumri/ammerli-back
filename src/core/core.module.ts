import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { AuthenticationModule } from './authentication/authentication.module';
import { ProductModule } from './product/product.module';

@Module({
  imports: [UserModule, AuthenticationModule, ProductModule],
})
export class CoreModule {}
