import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderProduct } from './entities/product-order.entity';
import { Checkout } from './entities/checkout.entity';
import { ProductModule } from '../product/product.module';
import { ChargiliModule } from 'src/core/chargili/chargili.module';
import chargiliConfig from 'src/config/chargili.config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderProduct, Checkout]),
    ProductModule,
    ChargiliModule.registerAsync(chargiliConfig.asProvider()),
  ],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
