import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
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
  ) {}

  logger = new Logger(CategoryService.name);

  async getAll(): Promise<CategoryResDto[]> {
    const categories = await this.categoryRepo.find({
      where: { parentCategoryId: IsNull() },
    });

    const categoriesWithPresignedUrls = await Promise.all(
      categories.map(async (c) => {
        let presignedUrl = '';
        if (c.pictureUrl) {
          presignedUrl = await this.objectStorageService.getPresignedUrl(
            c.pictureUrl,
            BUCKET_TARGETS.CATEGORY_PICTURES,
          );
        }
        return {
          id: c.id,
          label: c.label,
          pictureUrl: presignedUrl,
        };
      }),
    );

    return categoriesWithPresignedUrls;
  }

  async getChildrenCaregories(parentId: number): Promise<CategoryResDto[]> {
    const categories = await this.categoryRepo.find({
      where: { parentCategoryId: parentId },
    });
    const categoriesWithPresignedUrls = await Promise.all(
      categories.map(async (c) => {
        let presignedUrl = '';
        if (c.pictureUrl) {
          presignedUrl = await this.objectStorageService.getPresignedUrl(
            c.pictureUrl,
            BUCKET_TARGETS.CATEGORY_PICTURES,
          );
        }
        return {
          id: c.id,
          label: c.label,
          pictureUrl: presignedUrl,
        };
      }),
    );
    return categoriesWithPresignedUrls;
  }

  async create(
    dto: CreateCategoryDto,
    picutre: Express.Multer.File,
  ): Promise<CategoryResDto> {
    const objectName = this.objectStorageService.generateUniqueObjectName(
      picutre.originalname,
    );
    const category = this.categoryRepo.create({
      ...dto,
      pictureUrl: objectName,
    });
    const newCategory = await this.categoryRepo.save(category);

    await this.uploadQueue.add(UPLOAD_JOBS.UPLOAD_FILE, {
      file: picutre,
      options: { objectName },
      metadata: {
        targetId: newCategory.id,
        targetType: BUCKET_TARGETS.CATEGORY_PICTURES,
      },
    });

    const presignedUrl = await this.objectStorageService.getPresignedUrl(
      objectName,
      BUCKET_TARGETS.CATEGORY_PICTURES,
    );

    return {
      id: newCategory.id,
      label: newCategory.label,
      pictureUrl: presignedUrl,
    };
  }

  async update(
    id: number,
    dto: Partial<CreateCategoryDto>,
    newPicture?: Express.Multer.File,
  ): Promise<{ message: string }> {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
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
      ...dto,
      pictureUrl,
    });
    return { message: 'Category updated successfully' };
  }

  async remove(id: number): Promise<{ message: string }> {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    const productsCount = await this.productRepo.count({
      where: { categoryId: id },
    });

    if (productsCount > 0) {
      throw new BadRequestException(
        `Cannot delete category. ${productsCount} product(s) are linked to this category.`,
      );
    }

    await this.categoryRepo.softDelete(id);
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
    return { message: 'Category soft deleted successfully' };
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
}
