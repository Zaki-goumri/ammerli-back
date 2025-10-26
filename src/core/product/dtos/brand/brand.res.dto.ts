import { ApiProperty } from '@nestjs/swagger';

export class BrandResDto {
  @ApiProperty({
    example: 1,
    description: 'Unique identifier of the brand',
  })
  id: number;

  @ApiProperty({
    example: 'Nike',
    description: 'Label of the brand',
  })
  label: string;
}
