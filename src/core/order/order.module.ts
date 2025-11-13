import { MiddlewareConsumer, Module, forwardRef } from '@nestjs/common';
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
import { UserModule } from '../user/user.module';
import { Tracking } from './entities/tracking.entity';
import { TrackingService } from './services/tracking.service';
import { TrackingController } from './tracking.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { QueueModule } from 'src/infrastructure/queue/queue.module';
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module';
import { User } from '../user/entities/user.entity';
import { Address } from '../user/entities/address.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderProduct,
      Checkout,
      Tracking,
      User,
      Address,
    ]),
    ProductModule,
    ChargiliModule.registerAsync(chargiliConfig.asProvider()),
    UserModule,
    NotificationsModule,
    EventEmitterModule,
  ],
  controllers: [OrderController, TrackingController],
  providers: [OrderService, CheckoutService, TrackingService],
  exports: [OrderService],
})
export class OrderModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ChargilyWebhookMiddleware)
      .forRoutes('order/webhook/chargili');
  }
}
