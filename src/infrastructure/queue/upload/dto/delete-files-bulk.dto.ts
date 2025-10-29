import { FinalizePayloadDto } from './finalize-payload.dto';

export class DeleteFilesBulkDto {
  objectUrls: string[];
  metadata?: FinalizePayloadDto;
}
