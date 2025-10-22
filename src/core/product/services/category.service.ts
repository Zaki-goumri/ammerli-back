import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { InjectQueue } from '@nestjs/bullmq';
import { QUEUE_NAME } from 'src/common/constants/queues';
import { Queue } from 'bullmq';
import { ObjectService } from 'src/infrastructure/object-storage/object-storage.service';
import { UPLOAD_JOBS } from 'src/common/constants/jobs';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectQueue(QUEUE_NAME.UPLOAD)
    private readonly uploadQueue: Queue,
    private readonly objectStorageService: ObjectService,
  ) {}

  async getAll(): Promise<Category[]> {
    return this.categoryRepo.find();
  }

  async create(label: string, picutre: Express.Multer.File): Promise<Category> {
    const objectName = this.objectStorageService.generateUniqueObjectName(
      picutre.originalname,
    );
    const pictureUrl = this.objectStorageService.getFileUrl(objectName);
    await this.uploadQueue.add(UPLOAD_JOBS.UPLOAD_FILE, {
      file: picutre,
      options: { objectName },
    });
    const category = this.categoryRepo.create({ label, pictureUrl });
    return this.categoryRepo.save(category);
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
}
