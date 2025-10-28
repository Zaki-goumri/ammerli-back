import { ApiProperty } from '@nestjs/swagger';
import { ORDER_STATUS, OrderStatus } from '../enums/delivery.enum';

export class SendTrackingDto {
  @ApiProperty({
    example: ORDER_STATUS.PREPARATION,
    description: 'The current status of the order',
    enum: ORDER_STATUS,
  })
  status: OrderStatus;
  @ApiProperty({
    enum: ORDER_STATUS,
    example: ORDER_STATUS.PREPARATION,
    description: 'The current status of the order',
  })
  createdAt: Date;
}
