import { UploadingOptions } from 'src/infrastructure/object-storage/types/upload-options.interface';

export class UploadJobDto {
  file: Express.Multer.File;
  options?: UploadingOptions;
  metadata: { targetId: number; targetType: string; [key: string]: any };
}
