import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateOrderResponseDto } from './create-order-response.dto';

export class CreateOrderResDto {
  @ApiProperty()
  order: CreateOrderResponseDto;

  @ApiPropertyOptional()
  checkoutUrl?: string;
}
