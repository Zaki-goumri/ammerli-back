import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Order } from './order.entity';
import {
  CHECKOUT_STATUS,
  CheckoutStatus,
  CHECKOUT_STATUS_VALUES,
} from '../enums/checkout-status.enum';

@Entity({ name: 'checkouts' })
export class Checkout extends BaseEntity {
  @ApiProperty({ example: 12, description: 'Related order ID' })
  @Column()
  orderId: number;

  @ManyToOne(() => Order, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @ApiProperty({
    example: 'chk_9c7aefeb4b',
    description: 'Chargili checkout ID returned from Chargili API',
  })
  @Column()
  chargiliCheckoutId: string;

  @ApiProperty({
    example: 'inv_a87f9e5d4b',
    description: 'Chargili invoice ID (available after payment)',
    nullable: true,
  })
  @Column({ nullable: true })
  chargiliInvoiceId?: string;

  @ApiProperty({
    enum: CHECKOUT_STATUS,
    example: CHECKOUT_STATUS.PENDING,
    description: 'Current status of the checkout session',
  })
  @Column({
    type: 'enum',
    enum: CHECKOUT_STATUS_VALUES,
    default: CHECKOUT_STATUS.PENDING,
  })
  status: CheckoutStatus;

  @ApiProperty({
    example: 'https://pay.chargily.net/checkout/xyz',
    description: 'Redirect URL for the user to complete payment',
  })
  @Column()
  checkoutUrl: string;
}
