import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { REFUND_REASON, REFUND_REASON_VALUES, RefundReason } from '../enums/refund-reason.enum';

export class CreateRefundDto {
  @ApiProperty({
    description: 'Order ID to refund',
    example: 1,
  })
  @IsNumber()
  orderId: number;

  @ApiProperty({
    enum: REFUND_REASON_VALUES,
    description: 'Reason for refund',
    example: REFUND_REASON.ORDER_CANCELLED,
  })
  @IsEnum(REFUND_REASON)
  reason: RefundReason;

  @ApiProperty({
    description: 'Detailed description',
    example: 'Customer changed their mind',
    maxLength: 1000,
  })
  @IsString()
  @MaxLength(1000)
  description: string;

  @ApiPropertyOptional({
    description: 'Amount to refund (leave empty for full refund)',
    example: 150.5,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;
}
