import { ApiOperation, ApiProperty } from '@nestjs/swagger';
import { ProductPictureDto } from './product-picture.dto';

class CategoryDto {
  @ApiProperty()
  label: string;

  @ApiProperty()
  picture: string;
}

export class ProductDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string | null;

  @ApiProperty()
  price: number;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  brand: string;

  @ApiProperty({ type: CategoryDto })
  category: CategoryDto;

  @ApiProperty({ type: [String] })
  pictures: (string | undefined | PictureWithId)[];

  @ApiProperty()
  loveCount?: number;

  @ApiProperty({
    example: 12,
    description: 'quantity Per Batch of the product',
  })
  quantityPerBatch: number;

  @ApiProperty()
  specifications: string[];

  @ApiProperty()
  isLoved?: boolean;
}

export class PictureWithId {
  @ApiProperty()
  id: number;

  @ApiProperty()
  url: string;
}
