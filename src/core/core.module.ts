import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { AuthenticationModule } from './authentication/authentication.module';
import { ProductModule } from './product/product.module';
import { OrderModule } from './order/order.module';
import { ChargiliModule } from './chargili/chargili.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AnalyticsModule } from './analytics/analytics.module';
import chargiliConfig from 'src/config/chargili.config';
import { InvoiceModule } from 'src/core/invoice/invoice.module';

@Module({
  imports: [
    UserModule,
    AuthenticationModule,
    ProductModule,
    OrderModule,
    ChargiliModule.registerAsync(chargiliConfig.asProvider()),
    NotificationsModule,
    AnalyticsModule,
    InvoiceModule,
  ],
  exports: [InvoiceModule],
})
export class CoreModule {}
