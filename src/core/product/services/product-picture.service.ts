import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductPictutre } from '../entities/product-picture.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ProductPictureService {
  constructor(
    @InjectRepository(ProductPictutre)
    private readonly productPictureRepo: Repository<ProductPictutre>,
  ) {}

  async create(url: string, productId: number) {
    const existingPicturesCount = await this.productPictureRepo.count({
      where: { productId: productId },
    });
    const shouldBeMain = existingPicturesCount === 0;
    const preliminaryPicture = this.productPictureRepo.create({
      productId,
      url,
      isMain: shouldBeMain,
    });
    return await this.productPictureRepo.save(preliminaryPicture);
  }
}
