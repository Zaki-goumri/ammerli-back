import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { InjectQueue } from '@nestjs/bullmq';
import { QUEUE_NAME } from 'src/common/constants/queues';
import { Queue } from 'bullmq';
import { ObjectService } from 'src/infrastructure/object-storage/object-storage.service';
import { UPLOAD_JOBS } from 'src/common/constants/jobs';
import { OnEvent } from '@nestjs/event-emitter';
import { FinalizePayloadDto } from 'src/infrastructure/queue/upload/dto/finalize-payload.dto';
import { CreateCategoryDto } from '../dtos/category/create-category.dto';
import { CategoryResDto } from '../dtos/category/category.res.dto';
import { Product } from '../entities/product.entity';
import { BUCKET_TARGETS } from 'src/common/constants/buckets';
import { I18nService } from 'nestjs-i18n';
import { UpdateCategoryDto } from '../dtos/category/update-category.dto';
import { SubCategoryResDto } from '../dtos/category/sub-category-responose.dto';
import { an } from '@faker-js/faker/dist/airline-DF6RqYmq';
import { GetAllCategoriesDto } from '../dtos/category/get-all-categories.dto';
@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectQueue(QUEUE_NAME.UPLOAD)
    private readonly uploadQueue: Queue,
    private readonly objectStorageService: ObjectService,
    private readonly i18nService: I18nService,
  ) {}

  logger = new Logger(CategoryService.name);

  async getAll(): Promise<CategoryResDto[]> {
    const categories = await this.categoryRepo
      .createQueryBuilder('parent')
      .leftJoin('categories', 'child', 'child.parentCategoryId = parent.id')
      .select([
        'parent.id AS id',
        'parent.label AS label',
        'parent.pictureUrl AS "pictureUrl"',
      ])
      .addSelect('COUNT(child.id) > 0', 'hasChildren')
      .where('parent.parentCategoryId IS NULL')
      .groupBy('parent.id')
      .groupBy('parent.id')
      .addGroupBy('parent.label')
      .addGroupBy('parent.pictureUrl')
      .getRawMany();

    return categories.map((c) => {
      return {
        id: c.id,
        label: c.label,
        pictureUrl: c.pictureUrl,
        hasChildren: Boolean(c.hasChildren),
      };
    });
  }

  async getChildrenCaregories(parentId: number): Promise<CategoryResDto[]> {
    const categories = await this.categoryRepo.find({
      where: { parentCategoryId: parentId },
    });
    return categories.map((c) => {
      return {
        id: c.id,
        label: c.label,
        pictureUrl: c.pictureUrl,
      };
    });
  }

  async create(
    dto: CreateCategoryDto,
    picture: Express.Multer.File,
  ): Promise<CategoryResDto> {
    let objectName: string;
    let newCategory: Category;

    if (dto.parentCategoryId) {
      const parentCategory = await this.categoryRepo.findOne({
        where: { id: dto.parentCategoryId },
      });

      if (!parentCategory) {
        throw new BadRequestException({
          key: 'category.create.invalidParent',
          message: 'Parent category not found.',
        });
      }

      if (parentCategory.parentCategoryId) {
        throw new BadRequestException({
          key: 'category.create.subSubNotAllowed',
          message: 'Cannot create a sub-category under another sub-category.',
        });
      }
    }

    try {
      objectName = this.objectStorageService.generateUniqueObjectName(
        picture.originalname,
      );
      const category = this.categoryRepo.create({
        ...dto,
        pictureUrl: objectName,
      });

      newCategory = await this.categoryRepo.save(category);
    } catch (error) {
      throw new BadRequestException({
        key: 'category.create.duplicateLabel',
        args: { label: dto.label },
      });
    }

    await this.uploadQueue.add(UPLOAD_JOBS.UPLOAD_FILE, {
      file: picture,
      options: { objectName },
      metadata: {
        targetId: newCategory.id,
        targetType: BUCKET_TARGETS.CATEGORY_PICTURES,
      },
    });

    return {
      id: newCategory.id,
      label: newCategory.label,
      pictureUrl: newCategory.pictureUrl,
    };
  }

  async update(
    id: number,
    dto: UpdateCategoryDto,
    newPicture?: Express.Multer.File,
  ): Promise<{ message: string }> {
    const { newParentCategoryId, ...restDto } = dto;
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException({ key: 'category.notFound', args: { id } });
    }
    if (newParentCategoryId === category.id) {
      throw new BadRequestException({
        key: 'category.update.invalidParent',
      });
    }

    let pictureUrl: string | undefined;
    if (newPicture) {
      const objectName = this.objectStorageService.generateUniqueObjectName(
        newPicture.originalname,
      );
      pictureUrl = objectName;

      await this.uploadQueue.add(UPLOAD_JOBS.UPLOAD_FILE, {
        file: newPicture,
        options: { objectName },
        metadata: {
          targetId: id,
          targetType: BUCKET_TARGETS.CATEGORY_PICTURES,
        },
      });

      if (category.pictureUrl) {
        await this.uploadQueue.add(UPLOAD_JOBS.DELETE_FILES_BULK, {
          files: [
            {
              objectName: category.pictureUrl,
              bucketName: BUCKET_TARGETS.CATEGORY_PICTURES,
            },
          ],
          metadata: {
            targetId: id,
            targetType: BUCKET_TARGETS.CATEGORY_PICTURES,
          },
        });
      }
    }
    await this.categoryRepo.update(id, {
      ...restDto,
      pictureUrl,
      parentCategoryId: newParentCategoryId,
    });
    return { message: this.i18nService.t('category.update.success') };
  }

  async remove(id: number): Promise<{ message: string }> {
    return this.categoryRepo.manager.transaction(
      async (transactionalEntityManager) => {
        const category = await transactionalEntityManager.findOne(Category, {
          where: { id },
        });
        if (!category) {
          throw new NotFoundException({
            key: 'category.notFound',
            args: { id },
          });
        }

        const productsCount = await transactionalEntityManager.count(Product, {
          where: { categoryId: id },
        });

        if (productsCount > 0) {
          throw new BadRequestException({
            key: 'category.delete.hasProducts',
            args: { count: productsCount },
          });
        }

        const childrenCount = await transactionalEntityManager.count(Category, {
          where: { parentCategoryId: id },
        });

        if (childrenCount > 0) {
          throw new BadRequestException({
            key: 'category.delete.hasChildren',
            args: { count: childrenCount },
          });
        }

        await transactionalEntityManager.softDelete(Category, id);

        if (category.pictureUrl) {
          await this.uploadQueue.add(UPLOAD_JOBS.DELETE_FILES_BULK, {
            files: [
              {
                objectName: category.pictureUrl,
                bucketName: BUCKET_TARGETS.CATEGORY_PICTURES,
              },
            ],
            metadata: {
              targetId: id,
              targetType: BUCKET_TARGETS.CATEGORY_PICTURES,
            },
          });
        }

        return { message: this.i18nService.t('category.delete.success') };
      },
    );
  }

  private async clearPictureUrl(id: number): Promise<void> {
    await this.categoryRepo.update(id, { pictureUrl: undefined });
  }

  @OnEvent(`file.failed.${BUCKET_TARGETS.CATEGORY_PICTURES}`, { async: true })
  async handlePictureUpload(payload: FinalizePayloadDto): Promise<void> {
    this.logger.log(
      `Handling failed upload for category picture, target ID: ${payload.targetId}`,
    );
    await this.clearPictureUrl(payload.targetId);
  }

  async getSubCategories(): Promise<SubCategoryResDto[]> {
    const subCategories = await this.categoryRepo.find({
      where: { parentCategoryId: Not(IsNull()) },
      relations: ['parentCategory'],
      select: {
        id: true,
        label: true,
        pictureUrl: true,
        parentCategory: {
          id: true,
          label: true,
          pictureUrl: true,
        },
      },
    });
    return subCategories as SubCategoryResDto[];
  }

  async getAllCategories(): Promise<GetAllCategoriesDto> {
    const [mainCategories, subCategories] = await Promise.all([
      this.categoryRepo.find({
        where: { parentCategoryId: IsNull() },
        select: ['id', 'label', 'pictureUrl'],
      }),
      this.categoryRepo.find({
        where: { parentCategoryId: Not(IsNull()) },
        select: ['id', 'label', 'pictureUrl'],
      }),
    ]);

    return { mainCategories, subCategories };
  }
}
