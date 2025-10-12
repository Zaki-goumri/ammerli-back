import { Entity, Property, ManyToOne, Index } from '@mikro-orm/core';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../user/entities/user.entity';
import { Brand } from './brand.entity';
import { Category } from './category.entity';

@Entity({ tableName: 'products' })
export class Product extends BaseEntity {
  @ApiProperty({
    description: 'The picture of the product',
    example: 'https://example.com/product.jpg',
  })
  @Property()
  picture: string;

  @ApiProperty({
    description: 'The name of the product',
    example: 'Sample Product',
  })
  @Property()
  @Index()
  name: string;

  @ApiProperty({
    description: 'The description of the product',
    example: 'This is a sample product description.',
  })
  @Property({ nullable: true })
  description?: string;

  @ApiProperty({
    description: 'The price of the product',
    example: 100,
  })
  @Property()
  price: number;

  @ApiProperty({
    description: 'The quantity of the product',
    example: 10,
  })
  @Property()
  quantity: number;

  @ApiProperty({
    description: 'Id of the product in Chargili system',
    example: 'prod_1MZbWDL6Y0qyl8',
  })
  @Property()
  chargiliProductId: string;

  @ApiProperty({
    description: 'Id of the price in Chargili system',
    example: 'price_1MZbX2L6Y0qyl8',
  })
  @Property()
  chargiliPriceId: string;

  @ManyToOne(() => User)
  seller: User;

  @ManyToOne(() => Brand)
  brand: Brand;

  @ManyToOne(() => Category)
  category: Category;
}
