import { ApiProperty } from '@nestjs/swagger';

export class WholesellerProductDto {
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
    example: ['https://example.com/image.png'],
    description: 'URL of the main picture of the product',
  })
  pictures: string[];

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
    example: '2023-10-27T10:00:00.000Z',
    description: 'Creation date of the product',
  })
  createdAt: Date;

  @ApiProperty({
    example: 50,
    description: 'Available quantity of the product',
  })
  quantity: number;
}
