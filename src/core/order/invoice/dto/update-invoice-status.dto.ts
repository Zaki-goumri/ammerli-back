
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { InvoiceStatus } from '../entities/invoice.entity';

export class UpdateInvoiceStatusDto {
  @ApiProperty({
    enum: InvoiceStatus,
    description: 'The new status of the invoice.',
    example: InvoiceStatus.PAID,
  })
  @IsEnum(InvoiceStatus)
  status: InvoiceStatus;
}
