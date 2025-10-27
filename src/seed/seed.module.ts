import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { ConfigModule } from '@nestjs/config';
import { DbModule } from '../infrastructure/db/db.module';
import { User } from '../core/user/entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Brand } from '../core/product/entities/brand.entity';
import { Category } from '../core/product/entities/category.entity';
import { Product } from '../core/product/entities/product.entity';
import { ProductPicture } from '../core/product/entities/product-picture.entity';
import { Order } from '../core/order/entities/order.entity';
import { Checkout } from '../core/order/entities/checkout.entity';
import { Tracking } from '../core/order/entities/tracking.entity';
import { Address } from '../core/user/entities/address.entity';
import { OrderProduct } from 'src/core/order/entities/product-order.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env`,
    }),
    DbModule,
    TypeOrmModule.forFeature([
      User,
      Brand,
      Category,
      Product,
      ProductPicture,
      Order,
      Checkout,
      Tracking,
      Address,
      OrderProduct,
    ]),
  ],
  providers: [SeedService],
})
export class SeedModule {}

