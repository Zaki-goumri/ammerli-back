import { ApiProperty } from '@nestjs/swagger';

export class DeleteFileDto {
  objectName: string;
  metadata: { targetId: string; targetType: string; [key: string]: any };
}
