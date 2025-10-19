import { MiddlewareConsumer, Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderProduct } from './entities/product-order.entity';
import { Checkout } from './entities/checkout.entity';
import { ProductModule } from '../product/product.module';
import { ChargiliModule } from 'src/core/chargili/chargili.module';
import chargiliConfig from 'src/config/chargili.config';
import { ChargilyWebhookMiddleware } from '../chargili/middlewares/signature-verification.middleware';
import { OrderService } from './services/order.service';
import { CheckoutService } from './services/checkout.service';
@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderProduct, Checkout]),
    ProductModule,
    ChargiliModule.registerAsync(chargiliConfig.asProvider()),
  ],
  controllers: [OrderController],
  providers: [OrderService, CheckoutService],
})
export class OrderModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ChargilyWebhookMiddleware)
      .forRoutes('order/webhook/chargili');
  }
}
