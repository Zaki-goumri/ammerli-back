import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Relation,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from 'src/core/user/entities/user.entity';
import { Address } from 'src/core/user/entities/address.entity';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Checkout } from './checkout.entity';
import { OrderProduct } from './product-order.entity';
import {
  ORDER_PAYMENT_METHOD,
  ORDER_PAYMENT_METHOD_VALUES,
  OrderPaymentMethodType,
} from '../enums/order-payment-method.enum';

@Entity({ name: 'orders' })
export class Order extends BaseEntity {
  @ApiProperty({ example: 5, description: 'Buyer user ID' })
  @Column()
  buyerId: number;

  @ManyToOne(() => User, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'buyerId' })
  buyer: User;

  @ApiProperty({
    enum: ORDER_PAYMENT_METHOD_VALUES,
    example: ORDER_PAYMENT_METHOD.CASH,
    description: 'Payment method used for the order',
  })
  @Column({
    type: 'enum',
    enum: ORDER_PAYMENT_METHOD_VALUES,
  })
  paymentWay: OrderPaymentMethodType;

  @ApiProperty({
    example: 3,
    description:
      'Address ID of delivery if it is null the address is default one',
    nullable: true,
  })
  @Column({ nullable: false })
  addressId: number;

  @ManyToOne(() => Address, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'addressId' })
  address: Address;

  @ApiProperty({ example: 150.75, description: 'Total amount of the order' })
  @Column('decimal', { precision: 10, scale: 2 })
  totalAmount: number;

  @OneToMany(() => Checkout, (checkout) => checkout.order)
  checkouts: Relation<Checkout[]>;

  @OneToMany(() => OrderProduct, (op) => op.order, { cascade: true })
  orderProducts: Relation<OrderProduct[]>;
}
