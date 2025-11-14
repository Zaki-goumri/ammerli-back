import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from './entities/invoice.entity';
import { InvoiceGeneratorService } from './services/invoice-generator.service';
import { Order } from '../order/entities/order.entity';
import { ObjectStorageModule } from 'src/infrastructure/object-storage/object-storage.module';

/**
 * @module InvoiceJobsModule
 * @description Lightweight module specifically designed for background job processing.
 * This module provides only the services needed by queue processors, breaking the
 * circular dependency between QueueModule and InvoiceModule.
 *
 * Key Design Decision:
 * - InvoiceGeneratorService uses Order repository directly instead of OrderService
 * - This avoids importing the entire OrderModule with all its heavy dependencies
 *   (ProductService, ChargiliService, CheckoutService, UserService, etc.)
 * - Maintains proper separation of concerns and prevents circular dependencies
 *
 * Dependencies:
 * - InvoiceGeneratorService: Generates PDF invoices
 * - Order Repository: Direct access to order data with relations
 *
 * Usage: Import this module in QueueModule for invoice processors.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Invoice, Order])],
  providers: [InvoiceGeneratorService],
  exports: [InvoiceGeneratorService],
})
export class InvoiceJobsModule {}
