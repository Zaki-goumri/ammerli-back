import { Injectable, NotFoundException } from '@nestjs/common';
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
import { Logger } from '@nestjs/common';
import { CreateCategoryDto } from '../dtos/category/create-category.dto';
import { CategoryResDto } from '../dtos/category/category.res.dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
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
      metadata: { targetId: newCategory.id, targetType: 'category_picture' },
    });

    const presignedUrl =
      await this.objectStorageService.getPresignedUrl(objectName);

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
        metadata: { targetId: id, targetType: 'category_picture' },
      });

      if (category.pictureUrl) {
        await this.uploadQueue.add(UPLOAD_JOBS.DELETE_FILES_BULK, {
          objectUrls: [category.pictureUrl],
          metadata: { targetId: id, targetType: 'category_picture' },
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
    await this.categoryRepo.softDelete(id);
    if (category.pictureUrl) {
      await this.uploadQueue.add(UPLOAD_JOBS.DELETE_FILES_BULK, {
        objectUrls: [category.pictureUrl],
        metadata: { targetId: id, targetType: 'category_picture' },
      });
    }
    return { message: 'Category soft deleted successfully' };
  }

  private async clearPictureUrl(id: number): Promise<void> {
    await this.categoryRepo.update(id, { pictureUrl: undefined });
  }

  @OnEvent('file.failed.category_picture', { async: true })
  async handlePictureUpload(payload: FinalizePayloadDto): Promise<void> {
    this.logger.log(
      `Handling failed upload for category picture, target ID: ${payload.targetId}`,
    );
    await this.clearPictureUrl(payload.targetId);
  }
}
