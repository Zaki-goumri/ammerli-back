import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from 'src/core/user/entities/user.entity';
import { Address } from 'src/core/user/entities/address.entity';
import { BaseEntity } from 'src/common/entities/base.entity';
import { PAYEMENT_WAY, PaymentWay } from '../enums/payement-way.enum';
import { ORDER_STATUS, OrderStatus } from '../enums/delivery.enum';

@Entity({ name: 'orders' })
export class Order extends BaseEntity {
  @ApiProperty({ example: 5, description: 'Buyer user ID' })
  @Column()
  buyerId: number;

  @ManyToOne(() => User, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'buyerId' })
  buyer: User;

  @ApiProperty({ example: 9, description: 'Seller user ID' })
  @Column()
  sellerId: number;

  @ManyToOne(() => User, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'sellerId' })
  seller: User;

  @ApiProperty({
    enum: PAYEMENT_WAY,
    example: PAYEMENT_WAY.CIB,
    description: 'Payment method used for the order',
  })
  @Column({
    type: 'enum',
    enum: PAYEMENT_WAY,
    default: PAYEMENT_WAY.CIB,
  })
  payementWay: PaymentWay;

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

  @ApiProperty({
    enum: ORDER_STATUS,
    example: ORDER_STATUS.DELIVERED,
    description: 'Current status of the order',
  })
  @Column({
    type: 'enum',
    enum: ORDER_STATUS,
    default: ORDER_STATUS.CANCELLED,
  })
  status: OrderStatus;

  @ApiProperty({ example: 150.75, description: 'Total amount of the order' })
  @Column('decimal', { precision: 10, scale: 2 })
  totalAmount: number;
}
