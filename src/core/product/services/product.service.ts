import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  PaginationQueryDto,
  PaginationResponseDto,
} from 'src/common/dtos/pagination.dto';
import { EntityManager, Repository, In, Between } from 'typeorm';
import { Product } from '../entities/product.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdateProductDto } from '../dtos/product/update.dto';
import { FavProduct } from '../entities/fav-product.entity';
import { ProductResDto } from '../dtos/product/many-product.dto';
import { CreateProductDto } from '../dtos/product/create.dto';
import { UploadingOptions } from 'src/infrastructure/object-storage/types/upload-options.interface';
import { InjectQueue } from '@nestjs/bullmq';
import { QUEUE_NAME } from 'src/common/constants/queues';
import { ObjectService } from 'src/infrastructure/object-storage/object-storage.service';
import { UPLOAD_JOBS } from 'src/common/constants/jobs';
import { Queue } from 'bullmq';
import { ToggleFavoriteDto } from '../dtos/product/toggle-favorite.dto';
import { FavoriteProductDto } from '../dtos/product/favorite-product.dto';
import { WholesellerProductDto } from '../dtos/product/wholeseller-product.dto';
import { ProductDto } from '../dtos/product/product.dto';
import { ProductPicture } from '../entities/product-picture.entity';
import { Cron } from '@nestjs/schedule';
import { NotificationsService } from '../../notifications/notifications.service';
import { NOTIFICATION_TYPE } from '../../notifications/enums/notification-type.enum';
import { AdminProductDto } from '../dtos/product/admin-product.dto';

@Injectable()
export class ProductService {
  logger = new Logger(ProductService.name);
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(FavProduct)
    private readonly favProductRepo: Repository<FavProduct>,
    @InjectRepository(ProductPicture)
    private readonly productPictureRepo: Repository<ProductPicture>,
    @InjectQueue(QUEUE_NAME.UPLOAD)
    private readonly uploadQueue: Queue,
    private readonly objectService: ObjectService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // Notify sellers about products expiring in the next 15 days
  @Cron('0 0 1 1,15 * *')
  async sendProductExpirationNotifications() {
    const today = new Date();
    const fifteenDaysFromNow = new Date(today);
    fifteenDaysFromNow.setDate(today.getDate() + 15);

    const expiringProducts = await this.productRepo.find({
      where: {
        expirationDate: Between(today, fifteenDaysFromNow),
      },
    });

    const notificationPromises = expiringProducts.map((product) => {
      if (!product.expirationDate) return;
      const sellerId = product.sellerId;
      const daysRemaining =
        product?.expirationDate?.getTime() - today.getTime();
      const message = `ur product ${product.name} will expire in ${daysRemaining} days`;
      return this.notificationsService.saveNotificationRecord(
        'Product Expiration',
        message,
        sellerId,
        NOTIFICATION_TYPE.EXPIRING_SOON,
      );
    });

    await Promise.allSettled(notificationPromises);
  }

  async findManyForAdmin(
    paginationQuery: PaginationQueryDto,
    search?: string,
  ): Promise<PaginationResponseDto<AdminProductDto>> {
    const { page, limit } = paginationQuery;
    const offset = (page - 1) * limit;

    const queryBuilder = this.productRepo
      .createQueryBuilder('product')
      .leftJoin('product.pictures', 'mainPicture', 'mainPicture.isMain = TRUE')
      .select([
        'product.id AS id',
        'product.name AS name',
        'mainPicture.url AS mainPicture',
        'product.price AS price',
        'CASE WHEN product.quantity > 0 THEN TRUE ELSE FALSE END AS disponibility',
      ])
      .groupBy('product.id')
      .addGroupBy('mainPicture.url')
      .orderBy('product.createdAt', 'DESC');

    if (search) {
      queryBuilder.andWhere('(product.name ILIKE :search)', {
        search: `%${search}%`,
      });
    }
    const totalQueryBuilder = queryBuilder.clone();
    const total = await totalQueryBuilder.getCount();
    const productsRaw = await queryBuilder
      .skip(offset)
      .take(limit)
      .getRawMany();

    return {
      data: productsRaw,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
      },
    };
  }

  async findManyWithPagination(
    paginationQuery: PaginationQueryDto,
    userId: number,
    search?: string,
    categoryIds?: number[],
  ): Promise<PaginationResponseDto<ProductResDto>> {
    const { page, limit } = paginationQuery;
    const offset = (page - 1) * limit;

    const queryBuilder = this.productRepo
      .createQueryBuilder('product')
      .leftJoin('product.brand', 'brand')
      .leftJoin('product.category', 'category')
      .leftJoin(
        'product.favoritedBy',
        'fav_products',
        'fav_products.userId = :userId',
        {
          userId,
        },
      )
      .leftJoin('product.pictures', 'mainPicture', 'mainPicture.isMain = TRUE')
      .leftJoin('order_products', 'op', 'op.productId = product.id')
      .leftJoin('op.order', 'order', 'order.id = op.orderId')
      .leftJoin(
        'checkouts',
        'checkout',
        'checkout."orderId" = order.id AND checkout.isPaid = TRUE',
      )
      .select([
        'product.id AS id',
        'product.name AS name',
        'mainPicture.url AS picture',
        'product.price AS price',
        'brand.label AS brand',
        'category.label AS category',
        'product.createdAt AS createdAt',
        'COUNT(DISTINCT "order"."buyerId") AS "buyerCount"',
        'CASE WHEN fav_products.id IS NOT NULL THEN true ELSE false END AS "isLoved"',
      ])
      .groupBy('product.id')
      .addGroupBy('brand')
      .addGroupBy('category')
      .addGroupBy('picture')
      .addGroupBy('product.createdAt')
      .addGroupBy('fav_products.id')
      .orderBy('product.createdAt', 'DESC');

    if (categoryIds && categoryIds.length > 0) {
      queryBuilder.andWhere('category.id IN (:...categoryIds)', {
        categoryIds,
      });
    }
    if (search) {
      queryBuilder.andWhere(
        '(product.name ILIKE :search OR product.description ILIKE :search OR brand.label ILIKE :search OR category.label ILIKE :search)',
        { search: `%${search}%` },
      );
    }
    const totalQueryBuilder = queryBuilder.clone();
    const total = await totalQueryBuilder.getCount();
    const productsRaw = await queryBuilder
      .skip(offset)
      .take(limit)
      .getRawMany();

    const formatted = productsRaw.map((p) => ({
      id: p?.id,
      name: p?.name,
      price: parseInt(p?.price || '0', 10),
      brand: p?.brand,
      category: p?.category,
      picture: p?.picture,
      isLoved: p?.isLoved,
      buyerCount: parseInt(p?.buyerCount || '0', 10),
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

  async findOne(id: number): Promise<ProductDto> {
    const product = await this.productRepo.findOne({
      where: { id },
      relations: ['pictures', 'brand', 'category'],
    });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    const loveCount = await this.favProductRepo.count({
      where: { productId: id },
    });
    return {
      id: product.id,
      name: product.name,
      description: product.description ?? null,
      price: product.price,
      quantity: product.quantity,
      loveCount,
      brand: product.brand.label,
      category: {
        label: product.category.label,
        picture: product.category.pictureUrl,
      },
      pictures:
        product.pictures.filter((pic) => pic.url).map((pic) => pic.url) ?? [],
    };
  }

  async initiateQueuedCreation() {}

  async create(
    dto: CreateProductDto,
    sellerId: number,
    files: Array<Express.Multer.File>,
    uploadOptions: UploadingOptions,
  ): Promise<ProductDto> {
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
    return this.findOne(newProduct.id);
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

  async remove(id: number, userId: number): Promise<{ message: string }> {
    const product = await this.productRepo.findOne({
      where: { id, sellerId: userId },
      relations: ['pictures'],
    });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    const pictureUrls = product.pictures
      .map((pic) => pic.url)
      .filter(Boolean) as string[];

    await this.productRepo.softDelete(id);

    if (pictureUrls.length > 0) {
      await this.uploadQueue.add(UPLOAD_JOBS.DELETE_FILES_BULK, {
        objectUrls: pictureUrls,
        metadata: { targetId: id, targetType: 'product_picture' },
      });
    }
    return { message: 'Product soft deleted successfully' };
  }

  async deleteProductImages(
    productId: number,
    pictureIds: number[],
  ): Promise<{ message: string }> {
    const picturesToDelete = await this.productPictureRepo.find({
      where: { productId, id: In(pictureIds) },
    });

    if (picturesToDelete.length === 0) {
      throw new NotFoundException(
        'No product pictures found with the given IDs for this product',
      );
    }

    const pictureUrls = picturesToDelete
      .map((pic) => pic.url)
      .filter(Boolean) as string[];

    await this.productPictureRepo.softDelete({ id: In(pictureIds) });

    if (pictureUrls.length > 0) {
      await this.uploadQueue.add(UPLOAD_JOBS.DELETE_FILES_BULK, {
        objectUrls: pictureUrls,
        metadata: { targetId: productId, targetType: 'product_picture' },
      });
    }
    return {
      message: 'Product pictures soft deleted and queued for file deletion',
    };
  }

  //TODO: add type to return
  async findWholeSellerProducts(
    paginationQuery: PaginationQueryDto,
    sellerId: number,
    search?: string,
    categoryIds?: number[],
  ): Promise<PaginationResponseDto<WholesellerProductDto>> {
    const { page, limit } = paginationQuery;
    const offset = (page - 1) * limit;

    const queryBuilder = this.productRepo
      .createQueryBuilder('product')
      .leftJoin('product.brand', 'brand')
      .leftJoin('product.category', 'category')
      .leftJoin('product.seller', 'seller')
      .leftJoin('product.pictures', 'mainPicture', 'mainPicture.isMain = TRUE')
      .where('seller.id = :sellerId', { sellerId })
      .select([
        'product.id AS id',
        'product.name AS name',
        'product.price AS price',
        'mainPicture.url AS picture',
        'brand.label AS brand',
        'category.label AS category',
        'product.createdAt AS createdAt',
        'product.quantity AS quantity',
      ])
      .orderBy('product.createdAt', 'DESC');

    if (categoryIds && categoryIds.length > 0) {
      queryBuilder.andWhere('category.id IN (:...categoryIds)', {
        categoryIds,
      });
    }
    if (search) {
      queryBuilder.andWhere(
        '(product.name ILIKE :search OR product.description ILIKE :search OR brand.label ILIKE :search OR category.label ILIKE :search)',
        { search: `%${search}%` },
      );
    }
    const totalQueryBuilder = queryBuilder.clone();
    const total = await totalQueryBuilder.getCount();

    const productsRaw = await queryBuilder
      .skip(offset)
      .take(limit)
      .getRawMany();

    const formatted: WholesellerProductDto[] = productsRaw.map((p) => ({
      id: p?.id,
      name: p?.name,
      price: p?.price,
      brand: p?.brand,
      picture: p?.picture,
      category: p?.category,
      createdAt: p?.createdAt,
      quantity: p?.quantity,
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
    categoryIds?: number[],
  ): Promise<PaginationResponseDto<FavoriteProductDto>> {
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;

    const queryBuilder = this.favProductRepo
      .createQueryBuilder('favProduct')
      .leftJoin('favProduct.product', 'product')
      .leftJoin('product.brand', 'brand')
      .leftJoin('product.category', 'category')
      .leftJoin('product.pictures', 'mainPicture', 'mainPicture.isMain = TRUE')
      .where('favProduct.userId = :userId', { userId })
      .select([
        'product.id AS id',
        'product.name AS name',
        'product.price AS price',
        'mainPicture.url AS picture',
        'brand.label AS brand',
        'category.label AS category',
        'product.createdAt AS createdAt',
      ])
      .orderBy('product.createdAt', 'DESC');

    if (categoryIds && categoryIds.length > 0) {
      queryBuilder.andWhere('category.id IN (:...categoryIds)', {
        categoryIds,
      });
    }
    if (search) {
      queryBuilder.andWhere(
        '(product.name ILIKE :search OR product.description ILIKE :search OR brand.label ILIKE :search OR category.label ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const totalQueryBuilder = queryBuilder.clone();
    const total = await totalQueryBuilder.getCount();

    const productsRaw = await queryBuilder
      .skip(offset)
      .take(limit)
      .getRawMany();

    const formatted: FavoriteProductDto[] = productsRaw.map((p) => ({
      id: p?.id,
      productId: p?.id,
      name: p?.name,
      price: p?.price,
      brand: p?.brand,
      picture: p?.picture,
      category: p?.category,
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
  ): Promise<ToggleFavoriteDto> {
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

  //TODO: use upload bulk
  async addFilesToQueue(
    files: Array<Express.Multer.File>,
    uploadOptions: UploadingOptions,
    productId: number,
  ) {
    const queueFiles = files.map((file) => ({
      buffer: file.buffer,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    }));
    Promise.all(
      queueFiles.map((file) =>
        this.uploadQueue.add(UPLOAD_JOBS.UPLOAD_FILE, {
          file,
          uploadOptions: {
            ...uploadOptions,
            metadata: {
              targetId: productId,
              targetType: 'product_picture',
            },
          },
        }),
      ),
    ).catch((error) => {
      this.logger.error(
        `Failed to enqueue upload jobs for product ${productId}: ${error.message}`,
      );
    });
  }
}
