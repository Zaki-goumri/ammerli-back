import { ApiProperty } from '@nestjs/swagger';

export class AdminProductDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  mainPicture: string;

  @ApiProperty()
  disponibility: boolean;
}
