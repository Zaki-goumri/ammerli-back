import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brand } from '../entities/brand.entity';
import { BrandResDto } from '../dtos/brand/brand.res.dto';
import { Product } from '../entities/product.entity';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class BrandService {
  constructor(
    @InjectRepository(Brand)
    private readonly brandRepo: Repository<Brand>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly i18nService: I18nService,
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
    if (!brand) throw new NotFoundException(this.i18nService.t('brand.notFound'));

    brand.label = label;
    const updatedBrand = await this.brandRepo.save(brand);
    return { id: updatedBrand.id, label: updatedBrand.label };
  }

  async remove(id: number): Promise<void> {
    const brand = await this.brandRepo.findOne({ where: { id } });
    if (!brand) throw new NotFoundException(this.i18nService.t('brand.notFound'));

    const productsCount = await this.productRepo.count({
      where: { brandId: id },
    });

    if (productsCount > 0) {
      throw new BadRequestException(
        this.i18nService.t('brand.delete.hasProducts', {
          args: { count: productsCount },
        }),
      );
    }

    await this.brandRepo.delete(id);
  }
}
