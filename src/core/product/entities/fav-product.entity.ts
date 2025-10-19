import { Column, Entity, JoinColumn, ManyToOne, Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../user/entities/user.entity';
import { Product } from './product.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('fav_products')
export class FavProduct extends BaseEntity {
  @ManyToOne(() => User, { createForeignKeyConstraints: true })
  @JoinColumn({ name: 'userId' })
  user: Relation<User>;

  @ApiProperty({
    example: 5,
    description: 'ID of the user who favorited the product',
  })
  @Column()
  userId: number;

  @ApiProperty({
    example: 10,
    description: 'ID of the favorited product',
  })
  @Column()
  productId: number;

  @ManyToOne(() => Product, { createForeignKeyConstraints: true })
  @JoinColumn({ name: 'productId' })
  product: Relation<Product>;
}
