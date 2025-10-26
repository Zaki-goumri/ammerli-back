import { ApiProperty } from '@nestjs/swagger';
import { ORDER_STATUS_VALUES, OrderStatus } from '../enums/delivery.enum';
import { PAYMENT_WAY_VALUES, PaymentWay } from '../enums/payement-way.enum';

export class OrderDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty({ enum: ORDER_STATUS_VALUES })
  status: OrderStatus;

  @ApiProperty({ enum: PAYMENT_WAY_VALUES })
  payementWay: PaymentWay;

  @ApiProperty()
  addressId: number;

  @ApiProperty()
  buyerId: number;
}
