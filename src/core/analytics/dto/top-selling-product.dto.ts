import { ApiProperty } from '@nestjs/swagger';

export class TopSellingProductDto {
  @ApiProperty({
    description: 'Product ID',
    example: 1,
  })
  productId: number;

  @ApiProperty({
    description: 'Total quantity sold',
    example: 250,
  })
  totalQuantity: number;

  @ApiProperty({
    description: 'Presigned URL for the product image',
    example: 'https://storage.example.com/product-image.jpg',
    nullable: true,
  })
  productImage: string | null;
}

export class TopSellingProductRawResult {
  productId: number;
  total_quantity: string;
  product_image: string;
}
