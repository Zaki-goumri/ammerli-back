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

  @OnEvent('file.uploaded.product_picture', { async: true })
  async handleSingleUploadComplete(payload: {
    targetId: number;
    objectName: string;
  }): Promise<ProductPicture> {
    this.Logger.log(
      `Creating product picture for product ID: ${payload.targetId}`,
    );
    const existingPicturesCount = await this.productPictureRepo.count({
      where: { productId: payload.targetId },
    });
    const shouldBeMain = existingPicturesCount === 0;
    const preliminaryPicture = this.productPictureRepo.create({
      productId: payload.targetId,
      url: payload.objectName,
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

  @OnEvent('file.uploaded.bulk.product_picture', { async: true })
  async handleBulkUploadComplete(payload: {
    targetId: number;
    files: { objectName: string }[];
  }): Promise<void> {
    this.Logger.log(
      `Creating new pictures for product ID: ${payload.targetId} after bulk upload.`,
    );
    const beforeCreateTimestamp = new Date();

    const newPictures = payload.files.map((file, index) =>
      this.productPictureRepo.create({
        productId: payload.targetId,
        url: file.objectName,
        isMain: index === 0, // First new picture is the main one
      }),
    );

    await this.productPictureRepo.save(newPictures);
    this.Logger.log(`Successfully created ${newPictures.length} new pictures.`);

    this.eventEmitter.emit('product.pictures.cleanup', {
      productId: payload.targetId,
      beforeCreateTimestamp,
    });
  }

  @OnEvent('product.pictures.cleanup', { async: true })
  async handlePictureCleanup(payload: {
    productId: number;
    beforeCreateTimestamp: Date;
  }): Promise<void> {
    this.Logger.log(
      `Cleaning up old pictures for product ID: ${payload.productId}`,
    );

    const picturesToDelete = await this.productPictureRepo.find({
      where: {
        productId: payload.productId,
        createdAt: LessThan(payload.beforeCreateTimestamp),
      },
    });

    if (picturesToDelete.length === 0) {
      this.Logger.log('No old pictures to clean up.');
      return;
    }

    this.Logger.log(`Found ${picturesToDelete.length} old pictures to delete.`);

    const oldPictureUrls = picturesToDelete
      .map((p) => p.url)
      .filter((url): url is string => !!url);

    if (oldPictureUrls.length > 0) {
      await this.uploadQueue.add(UPLOAD_JOBS.DELETE_FILES_BULK, {
        objectUrls: oldPictureUrls,
      });
      this.Logger.log(
        `Queued bulk deletion job for ${oldPictureUrls.length} files in object storage.`,
      );
    }

    await this.productPictureRepo.delete({
      id: In(picturesToDelete.map((p) => p.id)),
    });
    this.Logger.log(
      `Successfully deleted ${picturesToDelete.length} old picture records from the database.`,
    );
  }
}
