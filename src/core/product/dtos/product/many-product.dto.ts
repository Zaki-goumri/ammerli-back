import { ApiProperty } from '@nestjs/swagger';

export class ProductResDto {
  @ApiProperty({
    example: 1,
    description: 'Unique identifier of the product',
  })
  id: number;

  @ApiProperty({
    example: 'Nike Air Zoom Pegasus 40',
    description: 'Name of the product',
  })
  name: string;

  @ApiProperty({
    example: 129.99,
    description: 'Price of the product',
  })
  price: number;

  @ApiProperty({
    example: 'Nike',
    description: 'Brand label of the product',
  })
  brand: string;

  @ApiProperty({
    example: 'Running Shoes',
    description: 'Category label of the product',
  })
  category: string;

  @ApiProperty({
    example: true,
    description: 'Whether the product is loved (favorited) by the current user',
  })
  isLoved: boolean;

  @ApiProperty({
    example: 'https://example.com/image.png',
    description: 'URL of the main picture of the product',
  })
  picture: string;
}
