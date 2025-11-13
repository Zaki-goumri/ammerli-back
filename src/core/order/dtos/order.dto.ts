import { ApiProperty } from '@nestjs/swagger';
import { PAYMENT_WAY_VALUES, PaymentWay } from '../enums/payment-way.enum';

export class OrderDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty({ enum: PAYMENT_WAY_VALUES })
  paymentWay: PaymentWay;

  @ApiProperty()
  addressId: number;

  @ApiProperty()
  buyerId: number;
}
