import { EntityRepository } from '@mikro-orm/postgresql';
import { Product } from '../entities/product.entity';
import { Brand } from '../entities/brand.entity';
import { Category } from '../entities/category.entity';
import { User } from 'src/core/user/entities/user.entity';
import { ProductWithChargili } from '../types/product-with-chargili.type';

export class ProductRepository extends EntityRepository<Product> {
  async findById(id: number): Promise<Product | null> {
    return this.findOne({ id }, { populate: ['brand', 'category'] });
  }

  async createProduct(dto: ProductWithChargili): Promise<Product> {
    const product = this.create({
      name: dto.name,
      description: dto.description,
      picture: dto.picture,
      price: dto.price,
      quantity: dto.quantity,
      chargiliProductId: dto.chargiliProductId,
      chargiliPriceId: dto.chargiliPriceId,
      brand: this.em.getReference(Brand, dto.brandId),
      category: this.em.getReference(Category, dto.categoryId),
      seller: this.em.getReference(User, dto.sellerId),
    });

    await this.em.persistAndFlush(product);
    return product;
  }

  async updateProduct(productData: Partial<Product>, id: number) {
    return this.nativeUpdate({ id }, productData);
  }

  async deleteProduct(id: number) {
    return this.nativeDelete({ id });
  }
}
