import {
  Entity,
  Column,
  ManyToOne,
  Index,
  DeleteDateColumn,
  Relation,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../user/entities/user.entity';
import { Brand } from './brand.entity';
import { Category } from './category.entity';

@Entity('products')
export class Product extends BaseEntity {
  @ApiProperty({
    description: 'The picture of the product',
    example: 'https://example.com/product.jpg',
  })
  @Column({ nullable: true })
  picture?: string;

  @ApiProperty({
    description: 'The name of the product',
    example: 'Sample Product',
  })
  @Column()
  @Index()
  name: string;

  @ApiProperty({
    description: 'The description of the product',
    example: 'This is a sample product description.',
  })
  @Column({ nullable: true })
  description?: string;

  @ApiProperty({
    description: 'The price of the product',
    example: 100,
  })
  @Column('decimal')
  price: number;

  @ApiProperty({
    description: 'The quantity of the product',
    example: 10,
  })
  @Column()
  quantity: number;

  @ManyToOne(() => User, (user) => user.products)
  @JoinColumn({ name: 'sellerId' })
  seller: Relation<User>;

  @ApiProperty({
    description: 'The ID of the seller (user) who owns this product',
    example: 1,
  })
  @Column()
  sellerId: number;

  @ManyToOne(() => Brand, { createForeignKeyConstraints: true })
  @JoinColumn({ name: 'brandId' })
  brand: Relation<Brand>;

  @ApiProperty({
    description: 'Brand ID reference',
    example: 1,
  })
  @Column()
  brandId: number;

  @ManyToOne(() => Category, { createForeignKeyConstraints: true })
  @JoinColumn({ name: 'categoryId' })
  category: Relation<Category>;

  @ApiProperty({
    description: 'Category ID reference',
    example: 5,
  })
  @Column()
  categoryId: number;

  @DeleteDateColumn()
  deletedAt?: Date;
}
