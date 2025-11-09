import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from './entities/invoice.entity';
import { InvoiceController } from './invoice.controller';
import { InvoiceService } from './services/invoice.service';
import { InvoiceGeneratorService } from './services/invoice-generator.service';
import { OrderModule } from 'src/core/order/order.module';
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module';

@Module({
  imports: [
    OrderModule,
    TypeOrmModule.forFeature([Invoice]),
    forwardRef(() => InfrastructureModule),
  ],
  controllers: [InvoiceController],
  providers: [InvoiceService, InvoiceGeneratorService],
  exports: [InvoiceService, InvoiceGeneratorService],
})
export class InvoiceModule {}
