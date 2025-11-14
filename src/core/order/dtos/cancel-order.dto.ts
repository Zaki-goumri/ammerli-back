import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * @class CancelOrderDto
 * @description DTO for cancelling an order
 */
export class CancelOrderDto {
  @ApiProperty({
    description: 'Reason for cancellation',
    example: 'Changed my mind',
    maxLength: 500,
  })
  @IsString()
  @MaxLength(500)
  reason: string;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Found better price elsewhere',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
