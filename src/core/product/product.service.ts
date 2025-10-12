import { Injectable, NotFoundException } from '@nestjs/common';
import {
  PaginationQueryDto,
  PaginationResponseDto,
} from 'src/common/dtos/pagination.dto';
import { ILike, Repository } from 'typeorm';
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
    search?: string,
    categoryId?: number,
  ): Promise<PaginationResponseDto<Product>> {
    const { page, limit } = paginationQuery;
    const offset = (page - 1) * limit;

    let where: any[] = [];

    if (categoryId) {
      where = where.length
        ? where.map((cond) => ({ ...cond, category: { id: categoryId } }))
        : [{ category: { id: categoryId } }];
    }

    if (search) {
      where = [
        { name: ILike(`%${search}%`) },
        { description: ILike(`%${search}%`) },
        { brand: { label: ILike(`%${search}%`) } },
        { category: { label: ILike(`%${search}%`) } },
      ];
    }
    //TODO: add buyers count
    const [products, total] = await this.productRepo.findAndCount({
      where: where.length > 0 ? where : undefined,
      relations: ['brand'],
      select: {
        brand: { label: true, createdAt: false, updatedAt: false, id: false },
        updatedAt: false,
        description: false,
      },
      take: limit,
      skip: offset,
      order: { createdAt: 'DESC' },
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
