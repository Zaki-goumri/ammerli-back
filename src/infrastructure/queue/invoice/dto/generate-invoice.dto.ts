import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class GenerateInvoiceDto {
  @ApiProperty({
    description: 'The ID of the order to generate the invoice for.',
  })
  @IsNumber()
  orderId: number;
}
