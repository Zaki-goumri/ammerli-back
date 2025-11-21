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
    //TODO: implement notification or cleanup logic
  }

  @OnEvent(`file.uploaded.bulk.${BUCKET_TARGETS.PRODUCT_PICTURES}`, {
    async: true,
  })
  async handleBulkUploadComplete(payload: {
    targetId: number;
    files: { objectName: string }[];
  }): Promise<void> {
    this.Logger.log(
      `Replacing pictures for product ID: ${payload.targetId} after bulk upload.`,
    );

    await this.productPictureRepo.manager.transaction(async (manager) => {
      const pictureRepo = manager.getRepository(ProductPicture);

      // 1. Find and queue old pictures for deletion
      const oldPictures = await pictureRepo.find({
        where: { productId: payload.targetId },
      });

      if (oldPictures.length > 0) {
        this.Logger.log(`Found ${oldPictures.length} old pictures to delete.`);
        const oldPictureUrls = oldPictures
          .map((p) => p.url)
          .filter((url): url is string => !!url);

        if (oldPictureUrls.length > 0) {
          await this.uploadQueue.add(UPLOAD_JOBS.DELETE_FILES_BULK, {
            files: oldPictureUrls.map((url) => ({
              objectName: url,
              bucketName: BUCKET_TARGETS.PRODUCT_PICTURES,
            })),
          });
          this.Logger.log(
            `Queued bulk deletion job for ${oldPictureUrls.length} files in object storage.`,
          );
        }

        // 2. Delete old picture records from the database
        await pictureRepo.remove(oldPictures);
        this.Logger.log(
          `Successfully deleted ${oldPictures.length} old picture records from the database.`,
        );
      }

      // 3. Save the new pictures
      const newPictures = payload.files.map((file, index) =>
        pictureRepo.create({
          productId: payload.targetId,
          url: file.objectName,
          isMain: index === 0, // First new picture is the main one
        }),
      );

      await pictureRepo.save(newPictures);
      this.Logger.log(
        `Successfully created ${newPictures.length} new pictures.`,
      );
    });
  }
}
