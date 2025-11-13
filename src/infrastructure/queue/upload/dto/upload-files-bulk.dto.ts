import { UploadingOptions } from 'src/infrastructure/object-storage/types/upload-options.interface';
import { FinalizePayloadDto } from './finalize-payload.dto';

export class UploadFilesBulkDto {
  files: Array<{
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
  }>;
  options?: UploadingOptions;
  metadata?: FinalizePayloadDto;
}
