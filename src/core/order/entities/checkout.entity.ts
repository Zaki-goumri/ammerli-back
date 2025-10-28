import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Order } from './order.entity';
import {
  PAYMENT_WAY_VALUES,
  PAYEMENT_WAY,
  PaymentWay,
} from '../enums/payement-way.enum';

@Entity({ name: 'checkouts' })
export class Checkout extends BaseEntity {
  @ApiProperty({ example: 12, description: 'Related order ID' })
  @Column()
  orderId: number;

  @ManyToOne(() => Order, (order) => order.checkouts, {
    onDelete: 'NO ACTION',
    nullable: true,
  })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @ApiProperty({
    example: 'chk_9c7aefeb4b',
    description: 'Chargili checkout ID returned from Chargili API',
  })
  @Column({ unique: true })
  chargiliCheckoutId: string;

  @ApiProperty({
    description: 'Current status of the checkout session',
    example: true,
  })
  @Column({ type: 'boolean', default: false })
  isPaid: boolean;

  @ApiProperty({
    enum: PAYMENT_WAY_VALUES,
    example: PAYEMENT_WAY.CIB,
    description: 'Current status of the checkout session',
  })
  @Column({
    type: 'enum',
    enum: PAYMENT_WAY_VALUES,
    default: PAYEMENT_WAY.CASH,
  })
  paymentWay?: PaymentWay;

  @ApiProperty({
    example: '2.50',
    description: 'fees of the checkout session',
  })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  fees?: number;

  @ApiProperty({
    example: '2024-06-01T12:34:56Z',
    description: 'Timestamp when the payment was completed',
    nullable: true,
  })
  @Column({ type: 'timestamp', nullable: true })
  paidAt?: Date;

  @ApiProperty({
    example: 'abcdef1234567890',
    description: 'Signature for verifying the checkout data',
  })
  @Column({ unique: true, nullable: true })
  signature?: string;
}
