import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PaginationQueryDto,
  PaginationResponseDto,
} from 'src/common/dtos/pagination.dto';
import { EntityManager, Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdateProductDto } from '../dtos/product/update.dto';
import { FavProduct } from '../entities/fav-product.entity';
import { ProductResDto } from '../dtos/product/many-product.dto';
import { FavProductDtoRes } from '../dtos/product/fav-product.dto';
import { CreateProductDto } from '../dtos/product/create.dto';
import { UploadingOptions } from 'src/infrastructure/object-storage/types/upload-options.interface';
import { InjectQueue } from '@nestjs/bullmq';
import { QUEUE_NAME } from 'src/common/constants/queues';
import { ObjectService } from 'src/infrastructure/object-storage/object-storage.service';
import { UPLOAD_JOBS } from 'src/common/constants/jobs';
import { Queue } from 'bullmq';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(FavProduct)
    private readonly favProductRepo: Repository<FavProduct>,
    @InjectQueue(QUEUE_NAME.UPLOAD)
    private readonly uploadQueue: Queue,
    private readonly objectService: ObjectService,
  ) {}

  //TODO: calculate buyer
  async findManyWithPagination(
    paginationQuery: PaginationQueryDto,
    userId: number,
    search?: string,
    categoryId?: number,
  ): Promise<PaginationResponseDto<ProductResDto>> {
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
        'brand.label',
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
      brand: p.brand.label,
      category: p.category.label,
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

  async initiateQueuedCreation() {}

  async create(
    dto: CreateProductDto,
    sellerId: number,
    files: Array<Express.Multer.File>,
    uploadOptions: UploadingOptions,
  ): Promise<Product> {
    const preliminaryProduct = this.productRepo.create({
      ...dto,
      sellerId,
    });
    const newProduct = await this.productRepo.save(preliminaryProduct);
    const productId = newProduct.id;
    this.addFilesToQueue(files, uploadOptions, productId).catch((error) => {
      console.error(
        `Failed to add files to queue for product ${productId}:`,
        error,
      );
    });
    return newProduct;
  }

  async update(
    id: number,
    dto: UpdateProductDto,
  ): Promise<{ message: string }> {
    const { affected } = await this.productRepo.update(id, dto);
    if (affected === 0) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return { message: 'Product successfully updated' };
  }

  //TODO: check ownership
  async remove(id: number): Promise<{ message: string }> {
    const { affected } = await this.productRepo.delete(id);
    if (affected === 0) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return { message: 'Product successfully deleted' };
  }

  //TODO: add type to return
  async findWholeSellerProducts(
    paginationQuery: PaginationQueryDto,
    sellerId: number,
    search?: string,
    categoryId?: number,
  ): Promise<PaginationResponseDto<any>> {
    const { page, limit } = paginationQuery;
    const offset = (page - 1) * limit;

    const queryBuilder = this.productRepo
      .createQueryBuilder('product')
      .leftJoin('product.brand', 'brand')
      .leftJoin('product.category', 'category')
      .leftJoin('product.seller', 'seller')
      .where('seller.id = :sellerId', { sellerId })
      .select([
        'product.id',
        'product.name',
        'product.price',
        'product.picture',
        'brand.label',
        'category.label',
        'product.createdAt',
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
      brand: p.brand.label,
      picture: p.picture,
      category: p.category.label,
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

  async getFavoriteProducts(
    userId: number,
    pagination: PaginationQueryDto,
    search?: string,
    categoryId?: number,
  ): Promise<PaginationResponseDto<FavProductDtoRes>> {
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;

    const queryBuilder = this.favProductRepo
      .createQueryBuilder('favProduct')
      .leftJoin('favProduct.product', 'product')
      .leftJoin('product.brand', 'brand')
      .leftJoin('product.category', 'category')
      .where('favProduct.userId = :userId', { userId })
      .select([
        'favProduct.id',
        'product.id',
        'product.name',
        'product.price',
        'product.picture',
        'brand.label',
        'category.label',
        'product.createdAt',
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
      productId: p.product.id,
      name: p.product.name,
      price: p.product.price,
      brand: p.product.brand.label,
      picturj: p.product.picture,
      category: p.product.category.label,
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

  async validateAndReserveStock(
    items: {
      productId: number;
      quantity: number;
    }[],
    em: EntityManager,
  ): Promise<Product[]> {
    const productIds = items.map((item) => item.productId);

    const products = await em
      .createQueryBuilder(Product, 'product')
      .setLock('pessimistic_write')
      .whereInIds(productIds)
      .getMany();

    if (products.length !== productIds.length) {
      const foundIds = products.map((p) => p.id);
      const missingIds = productIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundException(
        `Products not found: ${missingIds.join(', ')}`,
      );
    }

    const updates: Product[] = [];
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) continue;
      if (product.quantity < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for "${product.name}". ` +
            `Available: ${product.quantity}, Requested: ${item.quantity}`,
        );
      }
      product.quantity -= item.quantity;
      updates.push(product);
    }
    await em.save(updates);
    return products;
  }

  async toggleFavorite(
    userId: number,
    productId: number,
  ): Promise<{ isLoved: boolean }> {
    const existing = await this.favProductRepo.findOneBy({ userId, productId });
    if (existing) {
      await this.favProductRepo.delete({ userId, productId });
      return { isLoved: false };
    } else {
      const favProduct = this.favProductRepo.create({ userId, productId });
      await this.favProductRepo.save(favProduct);
      return { isLoved: true };
    }
  }

  async addFilesToQueue(
    files: Array<Express.Multer.File>,
    uploadOptions: UploadingOptions,
    productId: number,
  ) {
    const queuePromises = files.map((file) => {
      const objectName = this.objectService.generateUniqueObjectName(
        file.originalname,
      );
      return this.uploadQueue.add(UPLOAD_JOBS.UPLOAD_FILE, {
        file,
        options: { ...uploadOptions, objectName },
        metadata: { productId },
      });
    });
    await Promise.all(queuePromises);
  }
}
