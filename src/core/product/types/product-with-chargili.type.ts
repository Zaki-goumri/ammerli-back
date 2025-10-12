import { User } from 'src/core/user/entities/user.entity';
import { CreateProductDto } from '../dtos/product/create.dto';
import { Brand } from '../entities/brand.entity';
import { Category } from '../entities/category.entity';
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/*
 * A type that combines CreateProductDto with Chargili product and price IDs.
 * */
export class ProductWithChargili extends CreateProductDto {
  @ApiProperty({
    description: 'The ID of the product in Chargili',
    example: 'prod_ABC123',
  })
  @IsString()
  chargiliProductId: string;
  @ApiProperty({
    description: 'The ID of the price in Chargili',
    example: 'price_XYZ456',
  })
  @IsString()
  chargiliPriceId: string;
}
