import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  async getAll(): Promise<Category[]> {
    return this.categoryRepo.find();
  }

  async create(label: string): Promise<Category> {
    const category = this.categoryRepo.create({ label });
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
