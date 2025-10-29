import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsInt } from 'class-validator';

export class DeleteProductPicturesDto {
  @ApiProperty({
    description: 'Array of product picture IDs to delete',
    type: [Number],
    example: [1, 2, 3],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  pictureIds: number[];
}
