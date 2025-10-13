import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brand } from '../entities/brand.entity';

@Injectable()
export class BrandService {
  constructor(
    @InjectRepository(Brand)
    private readonly brandRepo: Repository<Brand>,
  ) {}

  async getAll(): Promise<Brand[]> {
    return this.brandRepo.find();
  }

  async create(label: string): Promise<Brand> {
    const brand = this.brandRepo.create({ label });
    return this.brandRepo.save(brand);
  }

  async update(id: number, label: string): Promise<Brand> {
    const brand = await this.brandRepo.findOne({ where: { id } });
    if (!brand) throw new NotFoundException('Brand not found');

    brand.label = label;
    return this.brandRepo.save(brand);
  }

  async remove(id: number): Promise<void> {
    const result = await this.brandRepo.delete(id);
    if (result.affected === 0) throw new NotFoundException('Brand not found');
  }
}
