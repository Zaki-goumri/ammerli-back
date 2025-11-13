import { ApiProperty } from '@nestjs/swagger';
import {
  ORDER_PAYMENT_METHOD,
  OrderPaymentMethodType,
} from '../enums/order-payment-method.enum';

export class CreateOrderResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty({ enum: ORDER_PAYMENT_METHOD })
  paymentWay: OrderPaymentMethodType;

  @ApiProperty()
  addressId: number;

  @ApiProperty()
  buyerId: number;
}
