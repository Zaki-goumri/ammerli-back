import { ApiProperty } from '@nestjs/swagger';
import { ProductOrderItemDto } from './product-order-item.dto';
import { OrderStatus, ORDER_STATUS_VALUES } from '../enums/delivery.enum';
import { PaymentMethod, PaymentMethodType } from '../enums/payment-method.enum';

export class OrderListItemDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty()
  productCount: number;

  @ApiProperty({ enum: ORDER_STATUS_VALUES })
  status: OrderStatus;

  @ApiProperty({ enum: PaymentMethod })
  paymentWay: PaymentMethodType;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: [ProductOrderItemDto], required: false })
  products?: ProductOrderItemDto[];
}
