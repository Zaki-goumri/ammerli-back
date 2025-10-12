import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../user/entities/user.entity';
import { Brand } from './brand.entity';
import { Category } from './category.entity';
import { FavProduct } from './fav-product.entity';

@Entity('products')
export class Product extends BaseEntity {
  @ApiProperty({
    description: 'The picture of the product',
    example: 'https://example.com/product.jpg',
  })
  @Column()
  picture: string;

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

  @ApiProperty({
    description: 'Id of the product in Chargili system',
    example: 'prod_1MZbWDL6Y0qyl8',
  })
  @Column()
  chargiliProductId: string;

  @ApiProperty({
    description: 'Id of the price in Chargili system',
    example: 'price_1MZbX2L6Y0qyl8',
  })
  @Column()
  chargiliPriceId: string;

  @ManyToOne(() => User, (user) => user.products)
  seller: User;

  @ManyToOne(() => Brand)
  brand: Brand;

  @ManyToOne(() => Category)
  category: Category;

  @OneToMany(() => FavProduct, (favProduct) => favProduct.product)
  favoritedBy: FavProduct[];
}
