import { ApiProperty } from '@nestjs/swagger';
import { OrderDto } from './order.dto';
import { Checkout } from '../entities/checkout.entity';

export class CreateOrderResDto {
  @ApiProperty()
  order: OrderDto;

  @ApiProperty({ nullable: true })
  checkoutUrl: string | null;
}
