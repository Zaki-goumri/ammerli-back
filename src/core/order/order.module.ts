import { MiddlewareConsumer, Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { RefundController } from './refund.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderProduct } from './entities/product-order.entity';
import { Checkout } from './entities/checkout.entity';
import { Refund } from './entities/refund.entity';
import { ProductModule } from '../product/product.module';
import { ChargiliModule } from 'src/core/chargili/chargili.module';
import chargiliConfig from 'src/config/chargili.config';
import { ChargilyWebhookMiddleware } from '../chargili/middlewares/signature-verification.middleware';
import { OrderService } from './services/order.service';
import { CheckoutService } from './services/checkout.service';
import { RefundService } from './services/refund.service';
import { UserModule } from '../user/user.module';
import { Tracking } from './entities/tracking.entity';
import { TrackingService } from './services/tracking.service';
import { TrackingController } from './tracking.controller';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { User } from '../user/entities/user.entity';
import { Address } from '../user/entities/address.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderProduct,
      Checkout,
      Tracking,
      Refund,
      User,
      Address,
    ]),
    ProductModule,
    ChargiliModule.registerAsync(chargiliConfig.asProvider()),
    UserModule,
    EventEmitterModule,
  ],
  controllers: [OrderController, TrackingController, RefundController],
  providers: [OrderService, CheckoutService, TrackingService, RefundService],
  exports: [OrderService, RefundService],
})
export class OrderModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ChargilyWebhookMiddleware)
      .forRoutes('order/webhook/chargili');
  }
}
