import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Repository } from 'typeorm';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { FinalizePayloadDto } from 'src/infrastructure/queue/upload/dto/finalize-payload.dto';
import { ProductPicture } from '../entities/product-picture.entity';
import { InjectQueue } from '@nestjs/bullmq';
import { QUEUE_NAME } from 'src/common/constants/queues';
import { Queue } from 'bullmq';
import { UPLOAD_JOBS } from 'src/common/constants/jobs';
import { BUCKET_TARGETS } from 'src/common/constants/buckets';

@Injectable()
export class ProductPictureService {
  Logger = new Logger(ProductPictureService.name);

  constructor(
    @InjectRepository(ProductPicture)
    private readonly productPictureRepo: Repository<ProductPicture>,
    @InjectQueue(QUEUE_NAME.UPLOAD)
    private readonly uploadQueue: Queue,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @OnEvent(`file.uploaded.${BUCKET_TARGETS.PRODUCT_PICTURES}`, { async: true })
  async handleSingleUploadComplete(payload: {
    targetId: number;
    objectName: string;
  }): Promise<ProductPicture> {
    this.Logger.log(
      `Creating product picture for product ID: ${payload.targetId}`,
    );

    return this.productPictureRepo.manager.transaction(async (manager) => {
      const pictureRepo = manager.getRepository(ProductPicture);

      const mainPictureExists = await pictureRepo.count({
        where: { productId: payload.targetId, isMain: true },
      });

      const newPicture = pictureRepo.create({
        productId: payload.targetId,
        url: payload.objectName,
        isMain: mainPictureExists === 0,
      });

      return await pictureRepo.save(newPicture);
    });
  }

  @OnEvent(`file.failed.${BUCKET_TARGETS.PRODUCT_PICTURES}`, { async: true })
  async handleFailedUpload(payload: FinalizePayloadDto): Promise<void> {
    this.Logger.log(
      `Handling failed upload for product picture of product ID: ${payload.targetId}`,
    );
  }

  @OnEvent(`file.uploaded.bulk.${BUCKET_TARGETS.PRODUCT_PICTURES}`, {
    async: true,
  })
  async handleBulkAddComplete(payload: {
    targetId: number;
    files: { objectName: string }[];
  }) {
    this.Logger.log(
      `Adding pictures for product ID: ${payload.targetId} without deleting existing.`,
    );

    await this.productPictureRepo.manager.transaction(async (manager) => {
      const pictureRepo = manager.getRepository(ProductPicture);

      // Check if a main picture already exists
      const mainExists = await pictureRepo.count({
        where: { productId: payload.targetId, isMain: true },
      });

      const newPictures = payload.files.map((file, index) =>
        pictureRepo.create({
          productId: payload.targetId,
          url: file.objectName,
          isMain: mainExists === 0 && index === 0, // Only first file if no main exists
        }),
      );

      await pictureRepo.save(newPictures);
      this.Logger.log(`Successfully added ${newPictures.length} new pictures.`);
    });
  }
}
