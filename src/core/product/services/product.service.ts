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
import { BUCKET_TARGETS } from 'src/common/constants/buckets';

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

  // Notify sellers about products expiring in the next 15 days - runs on 1st and 15th of each month
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
      const daysRemaining = Math.ceil(
        (product.expirationDate.getTime() - today.getTime()) /
          (1000 * 60 * 60 * 24),
      );
      const message = `Your product "${product.name}" will expire in ${daysRemaining} days`;
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
    categoryIds?: number[],
    brandIds?: number[],
  ): Promise<PaginationResponseDto<AdminProductDto>> {
    const { page, limit } = paginationQuery;
    const offset = (page - 1) * limit;

    // First, get paginated product IDs
    const productIdsQuery = this.productRepo
      .createQueryBuilder('product')
      .leftJoin('product.brand', 'brand')
      .select('product.id', 'id')
      .orderBy('product.createdAt', 'DESC');

    if (categoryIds && categoryIds.length > 0) {
      productIdsQuery.andWhere('product.categoryId IN (:...categoryIds)', {
        categoryIds,
      });
    }
    if (brandIds && brandIds.length > 0) {
      productIdsQuery.andWhere('product.brandId IN (:...brandIds)', {
        brandIds,
      });
    }
    if (search) {
      productIdsQuery.andWhere(
        '(product.name ILIKE :search OR brand.label ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const total = await productIdsQuery.getCount();
    const paginatedIds = await productIdsQuery
      .limit(limit)
      .offset(offset)
      .getRawMany();

    if (paginatedIds.length === 0) {
      return {
        data: [],
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page * limit < total,
        },
      };
    }

    const productIds = paginatedIds.map((p) => p.id);

    // Now fetch full data for these product IDs
    const queryBuilder = this.productRepo
      .createQueryBuilder('product')
      .leftJoin('product.pictures', 'mainPicture', 'mainPicture.isMain = TRUE')
      .leftJoin('product.brand', 'brand')
      .where('product.id IN (:...productIds)', { productIds })
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

    const productsRaw = await queryBuilder.getRawMany();

    const preperdData = await Promise.all(
      productsRaw.map(async (product) => {
        product.price = parseInt(product.price, 10);

        if (product.mainpicture) {
          product.mainPicture = await this.objectService.getPresignedUrl(
            product.mainpicture,
            BUCKET_TARGETS.PRODUCT_PICTURES,
          );
        }
        delete product.mainpicture;
        return product;
      }),
    );
    return {
      data: preperdData,
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
    brandIds?: number[],
  ): Promise<PaginationResponseDto<ProductResDto>> {
    const { page, limit } = paginationQuery;
    const offset = (page - 1) * limit;

    const productIdsQuery = this.productRepo
      .createQueryBuilder('product')
      .leftJoin('product.brand', 'brand')
      .leftJoin('product.category', 'category')
      .select('product.id', 'id')
      .orderBy('product.createdAt', 'DESC');

    if (categoryIds && categoryIds.length > 0) {
      productIdsQuery.andWhere('category.id IN (:...categoryIds)', {
        categoryIds,
      });
    }
    if (brandIds && brandIds.length > 0) {
      productIdsQuery.andWhere('brand.id IN (:...brandIds)', {
        brandIds,
      });
    }
    if (search) {
      productIdsQuery.andWhere(
        '(product.name ILIKE :search OR product.description ILIKE :search OR brand.label ILIKE :search OR category.label ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const total = await productIdsQuery.getCount();
    const paginatedIds = await productIdsQuery
      .limit(limit)
      .offset(offset)
      .getRawMany();

    if (paginatedIds.length === 0) {
      return {
        data: [],
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page * limit < total,
        },
      };
    }

    const productIds = paginatedIds.map((p) => p.id);

    const queryBuilder = this.productRepo
      .createQueryBuilder('product')
      .leftJoin('product.brand', 'brand')
      .leftJoin('product.category', 'category')
      .leftJoin(
        'product.favoritedBy',
        'fav_products',
        'fav_products.userId = :userId',
        { userId },
      )
      .leftJoin('product.pictures', 'mainPicture', 'mainPicture.isMain = TRUE')
      .where('product.id IN (:...productIds)', { productIds })
      .select([
        'product.id AS id',
        'product.name AS name',
        'product.quantityPerBatch as quantityPerBatch',
        'mainPicture.url AS picture',
        'product.price AS price',
        'brand.label AS brand',
        'category.label AS category',
        'product.createdAt AS createdAt',
        'CASE WHEN fav_products.id IS NOT NULL THEN true ELSE false END AS "isLoved"',
      ])
      .groupBy('product.id')
      .addGroupBy('brand.label')
      .addGroupBy('category.label')
      .addGroupBy('mainPicture.url')
      .addGroupBy('product.createdAt')
      .addGroupBy('fav_products.id')
      .orderBy('product.createdAt', 'DESC');

    const productsRaw = await queryBuilder.getRawMany();

    const formatted = productsRaw.map((p) => ({
      id: p?.id,
      name: p?.name,
      price: parseInt(p?.price || '0', 10),
      brand: p?.brand,
      category: p?.category,
      picture: p?.picture,
      isLoved: p?.isLoved,
    }));

    return {
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
      },
      data: formatted,
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
      id: product?.id,
      name: product?.name,
      description: product?.description ?? null,
      price: product?.price,
      quantity: product?.quantity,
      loveCount,
      quantityPerBatch: product?.quantityPerBatch,
      brand: product?.brand?.label,
      category: {
        label: product?.category?.label,
        picture: product?.category?.pictureUrl,
      },
      pictures: product?.pictures.map((pic) => pic?.url) ?? [],
    };
  }

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
    return this.findOne(productId);
  }

  async update(
    id: number,
    dto: UpdateProductDto,
    sellerId: number,
    files: Array<Express.Multer.File>,
    uploadOptions: UploadingOptions,
  ): Promise<{ message: string }> {
    const product = await this.productRepo.findOne({
      where: { id, sellerId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Update text/numeric fields
    await this.productRepo.update(id, dto);

    // Handle file replacement if new files are uploaded
    if (files && files.length > 0) {
      const queueFiles = files.map((file) => ({
        buffer: file.buffer,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      }));

      await this.uploadQueue.add(UPLOAD_JOBS.UPLOAD_FILES_BULK, {
        files: queueFiles,
        options: uploadOptions,
        metadata: {
          targetId: id,
          targetType: BUCKET_TARGETS.PRODUCT_PICTURES,
        },
      });
    }

    return { message: 'Product update process initiated' };
  }

  async remove(id: number, userId: number): Promise<{ message: string }> {
    const product = await this.productRepo.findOne({
      where: { id, sellerId: userId },
    });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Soft delete keeps images for potential future restoration
    await this.productRepo.softDelete(id);

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
        files: pictureUrls.map((url) => ({
          objectName: url,
          bucketName: BUCKET_TARGETS.PRODUCT_PICTURES,
        })),
        metadata: {
          targetId: productId.toString(),
          targetType: BUCKET_TARGETS.PRODUCT_PICTURES,
        },
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
    brandIds?: number[],
  ): Promise<PaginationResponseDto<WholesellerProductDto>> {
    const { page, limit } = paginationQuery;
    const offset = (page - 1) * limit;

    // First, get paginated product IDs
    const productIdsQuery = this.productRepo
      .createQueryBuilder('product')
      .leftJoin('product.brand', 'brand')
      .leftJoin('product.category', 'category')
      .leftJoin('product.seller', 'seller')
      .where('seller.id = :sellerId', { sellerId })
      .select('product.id', 'id')
      .orderBy('product.createdAt', 'DESC');

    if (categoryIds && categoryIds.length > 0) {
      productIdsQuery.andWhere('category.id IN (:...categoryIds)', {
        categoryIds,
      });
    }
    if (brandIds && brandIds.length > 0) {
      productIdsQuery.andWhere('brand.id IN (:...brandIds)', {
        brandIds,
      });
    }
    if (search) {
      productIdsQuery.andWhere(
        '(product.name ILIKE :search OR product.description ILIKE :search OR brand.label ILIKE :search OR category.label ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const total = await productIdsQuery.getCount();
    const paginatedIds = await productIdsQuery
      .limit(limit)
      .offset(offset)
      .getRawMany();

    if (paginatedIds.length === 0) {
      return {
        data: [],
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page * limit < total,
        },
      };
    }

    const productIds = paginatedIds.map((p) => p.id);

    // Now fetch full data for these product IDs
    const queryBuilder = this.productRepo
      .createQueryBuilder('product')
      .leftJoin('product.brand', 'brand')
      .leftJoin('product.category', 'category')
      .leftJoin('product.pictures', 'mainPicture', 'mainPicture.isMain = TRUE')
      .where('product.id IN (:...productIds)', { productIds })
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

    const productsRaw = await queryBuilder.getRawMany();

    const productsWithPresignedUrls = await Promise.all(
      productsRaw.map(async (p) => {
        if (p.picture) {
          p.picture = await this.objectService.getPresignedUrl(
            p.picture,
            BUCKET_TARGETS.PRODUCT_PICTURES,
          );
        }
        return p;
      }),
    );

    const formatted: WholesellerProductDto[] = productsWithPresignedUrls.map(
      (p) => ({
        id: p?.id,
        name: p?.name,
        price: p?.price,
        brand: p?.brand,
        picture: p?.picture,
        category: p?.category,
        createdAt: p?.createdAt,
        quantity: p?.quantity,
      }),
    );

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
    brandIds?: number[],
  ): Promise<PaginationResponseDto<FavoriteProductDto>> {
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;

    // First, get paginated product IDs
    const productIdsQuery = this.favProductRepo
      .createQueryBuilder('favProduct')
      .leftJoin('favProduct.product', 'product')
      .leftJoin('product.brand', 'brand')
      .leftJoin('product.category', 'category')
      .where('favProduct.userId = :userId', { userId })
      .select('product.id', 'id')
      .orderBy('product.createdAt', 'DESC');

    if (categoryIds && categoryIds.length > 0) {
      productIdsQuery.andWhere('category.id IN (:...categoryIds)', {
        categoryIds,
      });
    }
    if (brandIds && brandIds.length > 0) {
      productIdsQuery.andWhere('brand.id IN (:...brandIds)', {
        brandIds,
      });
    }
    if (search) {
      productIdsQuery.andWhere(
        '(product.name ILIKE :search OR product.description ILIKE :search OR brand.label ILIKE :search OR category.label ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const total = await productIdsQuery.getCount();
    const paginatedIds = await productIdsQuery
      .limit(limit)
      .offset(offset)
      .getRawMany();

    if (paginatedIds.length === 0) {
      return {
        data: [],
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page * limit < total,
        },
      };
    }

    const productIds = paginatedIds.map((p) => p.id);

    // Now fetch full data for these product IDs
    const queryBuilder = this.favProductRepo
      .createQueryBuilder('favProduct')
      .leftJoin('favProduct.product', 'product')
      .leftJoin('product.brand', 'brand')
      .leftJoin('product.category', 'category')
      .leftJoin('product.pictures', 'mainPicture', 'mainPicture.isMain = TRUE')
      .where('product.id IN (:...productIds)', { productIds })
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

    const productsRaw = await queryBuilder.getRawMany();

    const productsWithPresignedUrls = await Promise.all(
      productsRaw.map(async (p) => {
        if (p.picture) {
          p.picture = await this.objectService.getPresignedUrl(
            p.picture,
            BUCKET_TARGETS.PRODUCT_PICTURES,
          );
        }
        return p;
      }),
    );

    const formatted: FavoriteProductDto[] = productsWithPresignedUrls.map(
      (p) => ({
        id: p?.id,
        productId: p?.id,
        name: p?.name,
        price: p?.price,
        brand: p?.brand,
        picture: p?.picture,
        category: p?.category,
      }),
    );

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
          options: uploadOptions,
          metadata: {
            targetId: productId,
            targetType: BUCKET_TARGETS.PRODUCT_PICTURES,
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
