import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from './entities/invoice.entity';
import { InvoiceController } from './invoice.controller';
import { InvoiceService } from './services/invoice.service';
import { InvoiceGeneratorService } from './services/invoice-generator.service';
import { OrderModule } from 'src/core/order/order.module';
import { Order } from '../order/entities/order.entity';
import { ObjectStorageModule } from 'src/infrastructure/object-storage/object-storage.module';

@Module({
  imports: [
    OrderModule,
    TypeOrmModule.forFeature([Invoice, Order]),
    ObjectStorageModule,
  ],
  controllers: [InvoiceController],
  providers: [InvoiceService, InvoiceGeneratorService],
  exports: [InvoiceService, InvoiceGeneratorService],
})
export class InvoiceModule {}
