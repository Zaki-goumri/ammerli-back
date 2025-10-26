import { ApiProperty } from '@nestjs/swagger';
import { OrderDto } from './order.dto';

export class CreateOrderResDto {
  @ApiProperty()
  order: OrderDto;

  @ApiProperty({ nullable: true })
  checkoutUrl: string | null;
}
