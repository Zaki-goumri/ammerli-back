import { ApiProperty } from '@nestjs/swagger';
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
  pictures: (string | undefined)[];
}
