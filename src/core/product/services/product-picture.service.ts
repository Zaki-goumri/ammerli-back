import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { FinalizePayloadDto } from 'src/infrastructure/queue/upload/dto/finalize-payload.dto';
import { ProductPicture } from '../entities/product-picture.entity';
import { Logger } from '@nestjs/common';

@Injectable()
export class ProductPictureService {
  constructor(
    @InjectRepository(ProductPicture)
    private readonly productPictureRepo: Repository<ProductPicture>,
  ) {}

  Logger = new Logger(ProductPictureService.name);
  //TODO: handle upload status
  @OnEvent('file.uploaded.product_picture', { async: true })
  async create(payload: FinalizePayloadDto): Promise<ProductPicture> {
    this.Logger.log(
      `Creating product picture for product ID: ${payload.targetId}`,
    );
    const existingPicturesCount = await this.productPictureRepo.count({
      where: { productId: payload.targetId },
    });
    const shouldBeMain = existingPicturesCount === 0;
    const preliminaryPicture = this.productPictureRepo.create({
      productId: payload.targetId,
      url: payload.fileUrl,
      isMain: shouldBeMain,
    });
    return await this.productPictureRepo.save(preliminaryPicture);
  }

  @OnEvent('file.failed.product_picture', { async: true })
  async handleFailedUpload(payload: FinalizePayloadDto): Promise<void> {
    this.Logger.log(
      `Handling failed upload for product picture of product ID: ${payload.targetId}`,
    );
    //TODO: implement notification or cleanup logic
  }
}
