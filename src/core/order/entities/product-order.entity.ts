import { Entity, ManyToOne, JoinColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Product } from 'src/core/product/entities/product.entity';
import { Order } from './order.entity';

@Entity('order_products')
export class OrderProduct extends BaseEntity {
  @ApiProperty()
  @ManyToOne(() => Product, { onDelete: 'NO ACTION', nullable: false })
  @JoinColumn({ name: 'productId' })
  product: Product;
  @Column()
  productId: number;

  @ApiProperty()
  @ManyToOne(() => Order, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column()
  orderId: number;

  @ApiProperty({
    example: 2,
    description: 'Quantity of the product in this order',
  })
  @Column({ type: 'int', default: 1 })
  quantity: number;

}
