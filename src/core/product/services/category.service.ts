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

  async getAll(): Promise<Category[]> {
    return this.categoryRepo.find();
  }

  async create(label: string, picutre: Express.Multer.File): Promise<Category> {
    const objectName = this.objectStorageService.generateUniqueObjectName(
      picutre.originalname,
    );
    const pictureUrl = this.objectStorageService.getFileUrl(objectName);
    const category = this.categoryRepo.create({ label, pictureUrl });
    const newCategory = await this.categoryRepo.save(category);

    await this.uploadQueue.add(UPLOAD_JOBS.UPLOAD_FILE, {
      file: picutre,
      options: { objectName },
      metadata: { targetId: newCategory.id, targetType: 'category_picture' },
    });
    return newCategory;
  }

  async update(id: number, label: string): Promise<Category> {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');

    category.label = label;
    return this.categoryRepo.save(category);
  }

  async remove(id: number): Promise<void> {
    const result = await this.categoryRepo.delete(id);
    if (result.affected === 0)
      throw new NotFoundException('Category not found');
  }
  //TODO: use one method to update
  private async clearPictureUrl(id: number): Promise<Category> {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');

    category.pictureUrl = '';
    return this.categoryRepo.save(category);
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
