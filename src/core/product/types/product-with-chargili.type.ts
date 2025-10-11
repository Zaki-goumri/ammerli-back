import { User } from 'src/core/user/entities/user.entity';
import { CreateProductDto } from '../dtos/product/create.dto';
import { Brand } from '../entities/brand.entity';
import { Category } from '../entities/category.entity';

/*
 * A type that combines CreateProductDto with Chargili product and price IDs.
 * */
export type ProductWithChargili = CreateProductDto & {
  chargiliProductId: string;
  chargiliPriceId: string;
};
