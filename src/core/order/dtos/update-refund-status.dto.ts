import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { REFUND_STATUS, REFUND_STATUS_VALUES, RefundStatus } from '../enums/refund-status.enum';

export class UpdateRefundStatusDto {
  @ApiProperty({
    enum: REFUND_STATUS_VALUES,
    description: 'New refund status',
    example: REFUND_STATUS.COMPLETED,
  })
  @IsEnum(REFUND_STATUS)
  status: RefundStatus;

  @ApiPropertyOptional({
    description: 'Admin note about the refund processing',
    example: 'Refund processed via Chargily dashboard on 2025-11-14',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  adminNote?: string;
}
