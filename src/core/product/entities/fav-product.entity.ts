import { Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../user/entities/user.entity';
import { Product } from './product.entity';

@Entity('fav_products')
export class FavProduct extends BaseEntity {
  @ManyToOne(() => User, (user) => user.favoriteProducts)
  user: User;

  @ManyToOne(() => Product, (product) => product.favoritedBy)
  product: Product;
}
