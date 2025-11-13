import { ApiProperty } from '@nestjs/swagger';
import { CreateOrderResponseDto } from './create-order-response.dto';

export class CreateOrderResDto {
  @ApiProperty()
  order: CreateOrderResponseDto;

  @ApiProperty({ nullable: true })
  checkoutUrl: string | null;
}
