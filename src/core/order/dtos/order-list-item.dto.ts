import { ApiProperty } from '@nestjs/swagger';
import { ProductOrderItemDto } from './product-order-item.dto';

export class OrderListItemDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty()
  productCount: number;

  @ApiProperty({ type: [ProductOrderItemDto], required: false })
  products?: ProductOrderItemDto[];
}
