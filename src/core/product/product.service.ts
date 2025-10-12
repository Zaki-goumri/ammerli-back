import { Injectable, NotFoundException } from '@nestjs/common';
import {
  PaginationQueryDto,
  PaginationResponseDto,
} from 'src/common/dtos/pagination.dto';
import { FilterQuery } from '@mikro-orm/core';
import { Product } from './entities/product.entity';
import { ProductRepository } from './repositories/product.repository';
import { UpdateProductDto } from './dtos/product/update.dto';
import { ProductWithChargili } from './types/product-with-chargili.type';

@Injectable()
export class ProductService {
  constructor(private readonly productRepo: ProductRepository) {}

  async findManyWithPagination(
    paginationQuery: PaginationQueryDto,
    search?: string,
    categoryId?: number,
  ): Promise<PaginationResponseDto<Product>> {
    const { page, limit } = paginationQuery;
    const offset = (page - 1) * limit;

    const where: FilterQuery<Product> = {};

    if (categoryId) {
      where.category = categoryId;
    }

    if (search) {
      where.$or = [
        { name: { $ilike: `%${search}%` } },
        { description: { $ilike: `%${search}%` } },
        { brand: { label: { $ilike: `%${search}%` } } },
        { category: { label: { $ilike: `%${search}%` } } },
      ];
    }

    const [products, total] = await this.productRepo.findAndCount(where, {
      populate: ['brand', 'category', 'seller'],
      limit,
      offset,
      orderBy: { createdAt: 'DESC' },
    });

    return {
      data: products,
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
    const product = await this.productRepo.findById(id);

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  //TODO: add charglili integration and change the type of dto
  async create(dto: ProductWithChargili): Promise<Product> {
    return this.productRepo.createProduct(dto);
  }

  async update(id: number, dto: UpdateProductDto): Promise<void> {
    const affectedRows = await this.productRepo.updateProduct(dto, id);

    if (affectedRows === 0) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
  }

  async remove(id: number): Promise<void> {
    const affectedRows = await this.productRepo.deleteProduct(id);

    if (affectedRows === 0) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
  }
}
