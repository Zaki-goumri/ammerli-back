import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from './entities/invoice.entity';
import { InvoiceController } from './invoice.controller';
import { InvoiceService } from './services/invoice.service';
import { InvoiceGeneratorService } from './services/invoice-generator.service';
import { OrderModule } from '../order.module';
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
