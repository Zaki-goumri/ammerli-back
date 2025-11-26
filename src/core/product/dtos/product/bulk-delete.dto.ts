import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsInt } from 'class-validator';

export class BulkDeleteProductsDto {
  @ApiProperty({
    description: 'An array of product IDs to delete.',
    type: [Number],
    example: [1, 2, 3],
  })
  @IsArray()
  @IsInt({ each: true })
  @ArrayMinSize(1)
  productIds: number[];
}
