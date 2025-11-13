import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod, PaymentMethodType } from '../enums/payment-method.enum';
import { ORDER_STATUS_VALUES, OrderStatus } from '../enums/delivery.enum';

export class PaymentInfoDto {
  @ApiProperty({
    description: 'The payment way of the order',
    enum: PaymentMethod,
  })
  paymentWay: PaymentMethodType;

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
