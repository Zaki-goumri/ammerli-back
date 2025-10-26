import { ApiProperty } from '@nestjs/swagger';

export class ToggleFavoriteDto {
  @ApiProperty({
    example: true,
    description: 'The new favorite status of the product',
  })
  isLoved: boolean;
}
