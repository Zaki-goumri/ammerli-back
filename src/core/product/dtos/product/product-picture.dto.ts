import { ApiProperty } from '@nestjs/swagger';

export class ProductPictureDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  url: string;

  @ApiProperty()
  isMain: boolean;
}
