import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brand } from '../entities/brand.entity';
import { BrandResDto } from '../dtos/brand/brand.res.dto';

@Injectable()
export class BrandService {
  constructor(
    @InjectRepository(Brand)
    private readonly brandRepo: Repository<Brand>,
  ) {}

  async getAll(): Promise<BrandResDto[]> {
    const brands = await this.brandRepo.find();
    return brands.map((brand) => ({ id: brand.id, label: brand.label }));
  }

  async create(label: string): Promise<BrandResDto> {
    const brand = this.brandRepo.create({ label });
    const newBrand = await this.brandRepo.save(brand);
    return { id: newBrand.id, label: newBrand.label };
  }

  async update(id: number, label: string): Promise<BrandResDto> {
    const brand = await this.brandRepo.findOne({ where: { id } });
    if (!brand) throw new NotFoundException('Brand not found');

    brand.label = label;
    const updatedBrand = await this.brandRepo.save(brand);
    return { id: updatedBrand.id, label: updatedBrand.label };
  }

  async remove(id: number): Promise<void> {
    const result = await this.brandRepo.delete(id);
    if (result.affected === 0) throw new NotFoundException('Brand not found');
  }
}
