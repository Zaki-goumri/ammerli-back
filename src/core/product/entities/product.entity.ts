import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
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

  @ManyToOne(() => User, (user) => user.products)
  @JoinColumn({ name: 'sellerId' })
  seller: Relation<User>;

  @ApiProperty({
    description: 'The ID of the seller (user) who owns this product',
    example: 1,
  })
  @Column()
  sellerId: number;

  @ManyToOne(() => Brand)
  brand: Brand;

  @ManyToOne(() => Category)
  category: Category;

  @OneToMany(() => FavProduct, (favProduct) => favProduct.product)
  favoritedBy: FavProduct[];

  @DeleteDateColumn()
  deletedAt?: Date;
}
