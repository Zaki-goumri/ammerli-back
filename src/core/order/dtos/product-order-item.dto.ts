import { ApiProperty } from '@nestjs/swagger';

export class ProductOrderItemDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  picture: string;

  @ApiProperty({ required: false })
  isDeleted?: boolean;
}
