import { ApiProperty } from '@nestjs/swagger';

export class CategoryResDto {
  @ApiProperty({
    example: 1,
    description: 'Unique identifier of the category',
  })
  id: number;

  @ApiProperty({
    example: 'Electronics',
    description: 'Label of the category',
  })
  label: string;

  @ApiProperty({
    example: 'https://example.com/image.png',
    description: 'URL of the picture of the category',
  })
  pictureUrl: string;

  @ApiProperty({
    example: true,
    description: 'does the category has subcategories',
  })
  hasChildren: boolean;
}
