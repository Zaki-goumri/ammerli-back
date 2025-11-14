import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../order/entities/order.entity';
import { User } from '../user/entities/user.entity';
import { Tracking } from '../order/entities/tracking.entity';
import { OrderProduct } from '../order/entities/product-order.entity';
import { MinioModule } from 'src/infrastructure/minio/minio.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, User, Tracking, OrderProduct]),
    MinioModule,
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
