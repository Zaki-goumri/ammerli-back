import { Entity, ManyToOne } from '@mikro-orm/core';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../user/entities/user.entity';
import { Product } from './product.entity';

@Entity({ tableName: 'fav_products' })
export class FavProduct extends BaseEntity {
  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => Product)
  product: Product;
}
