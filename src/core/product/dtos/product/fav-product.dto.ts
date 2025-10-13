import { ApiProperty, OmitType } from '@nestjs/swagger';
import { ProductResDto } from './many-product.dto';

export class FavProductDtoRes extends OmitType(ProductResDto, [
  'isLoved',
] as const) {
  @ApiProperty({
    example: 1,
    description: 'Unique identifier of the product',
  })
  productId: number;
}
