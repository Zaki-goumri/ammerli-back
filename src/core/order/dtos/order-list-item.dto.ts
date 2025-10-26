import { ApiProperty } from '@nestjs/swagger';
import { ORDER_STATUS_VALUES, OrderStatus } from '../enums/delivery.enum';
import { ProductOrderItemDto } from './product-order-item.dto';

export class OrderListItemDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty()
  productCount: number;

  @ApiProperty({ enum: ORDER_STATUS_VALUES })
  status: OrderStatus;

  @ApiProperty({ type: [ProductOrderItemDto], required: false })
  products?: ProductOrderItemDto[];
}
