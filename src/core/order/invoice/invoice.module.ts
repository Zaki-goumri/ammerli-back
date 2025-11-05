import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from './entities/invoice.entity';
import { InvoiceController } from './invoice.controller';
import { InvoiceService } from './services/invoice.service';
import { InvoiceGeneratorService } from './services/invoice-generator.service';
import { OrderModule } from '../order.module';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_NAME } from 'src/common/constants/queues';
import { ObjectStorageModule } from 'src/infrastructure/object-storage/object-storage.module';
import { QueueModule } from 'src/infrastructure/queue/queue.module';
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module';

@Module({
  imports: [
    OrderModule,
    TypeOrmModule.forFeature([Invoice]),
    InfrastructureModule,
  ],
  controllers: [InvoiceController],
  providers: [InvoiceService, InvoiceGeneratorService],
  exports: [InvoiceService, InvoiceGeneratorService],
})
export class InvoiceModule {}

