import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { AuthenticationModule } from './authentication/authentication.module';
import { ProductModule } from './product/product.module';
import { OrderModule } from './order/order.module';
import { ChargiliModule } from './chargili/chargili.module';
import chargiliConfig from 'src/config/chargili.config';

@Module({
  imports: [
    UserModule,
    AuthenticationModule,
    ProductModule,
    OrderModule,
    ChargiliModule.registerAsync(chargiliConfig.asProvider()),
  ],
})
export class CoreModule {}
