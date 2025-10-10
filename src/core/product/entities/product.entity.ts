import { Entity, Property, ManyToOne } from '@mikro-orm/core';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from 'src/common/entities/base.entity';
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
  pic: string;

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

  @ManyToOne(() => User)
  seller: User;

  @ManyToOne(() => Brand)
  brand: Brand;

  @ManyToOne(() => Category)
  category: Category;
}
