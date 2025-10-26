import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    const categories = await this.categoryRepo.find({ where: { parentCategoryId: undefined } });
    return categories.map(c => ({id: c.id, label: c.label, pictureUrl: c.pictureUrl}));
  }

  async getChildrenCaregories(parentId: number): Promise<CategoryResDto[]> {
    const categories = await this.categoryRepo.find({ where: { parentCategoryId: parentId } });
    return categories.map(c => ({id: c.id, label: c.label, pictureUrl: c.pictureUrl}));
  }

  async create(
    dto: CreateCategoryDto,
    picutre: Express.Multer.File,
  ): Promise<CategoryResDto> {
    const objectName = this.objectStorageService.generateUniqueObjectName(
      picutre.originalname,
    );
    const pictureUrl = this.objectStorageService.getFileUrl(objectName);
    const category = this.categoryRepo.create({ ...dto, pictureUrl });
    const newCategory = await this.categoryRepo.save(category);

    await this.uploadQueue.add(UPLOAD_JOBS.UPLOAD_FILE, {
      file: picutre,
      options: { objectName },
      metadata: { targetId: newCategory.id, targetType: 'category_picture' },
    });
    return {id: newCategory.id, label: newCategory.label, pictureUrl: newCategory.pictureUrl};
  }

  async update(
    id: number,
    dto: Partial<CreateCategoryDto>,
    newPicture?: Express.Multer.File,
  ): Promise<{ message: string }> {
    let pictureUrl: string | undefined;
    if (newPicture) {
      const objectName = this.objectStorageService.generateUniqueObjectName(
        newPicture.originalname,
      );
      pictureUrl = this.objectStorageService.getFileUrl(objectName);

      await this.uploadQueue.add(UPLOAD_JOBS.UPLOAD_FILE, {
        file: newPicture,
        options: { objectName },
        metadata: { targetId: id, targetType: 'category_picture' },
      });
    }
    await this.categoryRepo.update(id, {
      ...dto,
      pictureUrl,
    });
    return { message: 'Category updated successfully' };
  }

  //TODO: delete picutue
  async remove(id: number): Promise<void> {
    const result = await this.categoryRepo.delete(id);
    if (result.affected === 0)
      throw new NotFoundException('Category not found');
  }
  //TODO: use one method to update
  private async clearPictureUrl(id: number): Promise<void> {
    await this.categoryRepo.update(id, { pictureUrl: undefined });
  }
  //TODO: add notification
  @OnEvent('file.failed.category_picture', { async: true })
  async handlePictureUpload(payload: FinalizePayloadDto): Promise<void> {
    this.logger.log(
      `Handling failed upload for category picture, target ID: ${payload.targetId}`,
    );
    await this.clearPictureUrl(payload.targetId);
  }
}
