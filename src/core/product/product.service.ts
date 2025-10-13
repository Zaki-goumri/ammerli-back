import { Injectable, NotFoundException } from '@nestjs/common';
import {
  PaginationQueryDto,
  PaginationResponseDto,
} from 'src/common/dtos/pagination.dto';
import { ILike, QueryBuilder, Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdateProductDto } from './dtos/product/update.dto';
import { ProductWithChargili } from './types/product-with-chargili.type';
import { flip } from 'lodash';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async findManyWithPagination(
    paginationQuery: PaginationQueryDto,
    userId: number,
    search?: string,
    categoryId?: number,
  ): Promise<PaginationResponseDto<any>> {
    const { page, limit } = paginationQuery;
    const offset = (page - 1) * limit;

    const queryBuilder = this.productRepo
      .createQueryBuilder('product')
      .leftJoin('product.brand', 'brand')
      .leftJoin('product.category', 'category')
      .leftJoin('product.favoritedBy', 'fav', 'fav.userId = :userId', {
        userId,
      })
      .select([
        'product.id',
        'product.name',
        'product.price',
        'product.picture',
        'brand.label AS brand',
        'product.createdAt',
        'CASE WHEN fav.id IS NOT NULL THEN true ELSE false END AS "isLoved"',
      ])
      .skip(offset)
      .take(limit)
      .orderBy('product.createdAt', 'DESC');

    if (categoryId) {
      queryBuilder.andWhere('category.id = :categoryId', { categoryId });
    }
    if (search) {
      queryBuilder.andWhere(
        '(product.name ILIKE :search OR product.description ILIKE :search OR brand.label ILIKE :search OR category.label ILIKE :search)',
        { search: `%${search}%` },
      );
    }
    const [products, total] = await queryBuilder.getManyAndCount();

    const formatted = products.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      brand: p.brand,
      category: p.category,
      isLoved: p['isLoved'] === true || p['isLoved'] === 'true',
    }));

    return {
      data: formatted,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
      },
    };
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productRepo.findOneBy({ id });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  async create(dto: ProductWithChargili): Promise<Product> {
    const product = this.productRepo.create(dto);
    return this.productRepo.save(product);
  }

  async update(id: number, dto: UpdateProductDto): Promise<void> {
    const result = await this.productRepo.update(id, dto);

    if (result.affected === 0) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
  }

  async remove(id: number): Promise<void> {
    const result = await this.productRepo.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
  }
}
