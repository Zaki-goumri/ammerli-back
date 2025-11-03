import { ApiProperty } from '@nestjs/swagger';
import { PAYEMENT_WAY, PaymentWay } from '../enums/payement-way.enum';
import { ORDER_STATUS_VALUES, OrderStatus } from '../enums/delivery.enum';

export class PaymentInfoDto {
  @ApiProperty({
    description: 'The payment way of the order',
    enum: PAYEMENT_WAY,
  })
  paymentWay: PaymentWay;

  @ApiProperty({ description: 'The total amount of the order' })
  totalAmount: number;

  @ApiProperty({ description: 'The creation date of the order' })
  createdAt: Date;

  @ApiProperty({ description: 'The payment status of the order' })
  isPaid: boolean;

  @ApiProperty({
    description: 'The tracking status of the order',
    enum: ORDER_STATUS_VALUES,
  })
  trackingStatus: OrderStatus;
}
