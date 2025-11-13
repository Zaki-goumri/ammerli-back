import { ORDER_STATUS_VALUES, OrderStatus } from '../enums/delivery.enum';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod, PaymentMethodType } from '../enums/payment-method.enum';

export class OrderForAdminListItemDto {
  @ApiProperty({ description: 'The unique identifier of the order' })
  id: number;

  @ApiProperty({ description: 'The name of the client who placed the order' })
  clientName: string;

  @ApiProperty({
    description: 'The current status of the order delivery',
    enum: ORDER_STATUS_VALUES,
  })
  status: OrderStatus;

  @ApiProperty({
    description: 'The payment method of the order',
    enum: PaymentMethod,
  })
  paymentWay: PaymentMethodType;
}
