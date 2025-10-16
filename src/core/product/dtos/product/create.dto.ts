import {
  IsString,
  IsNumber,
  IsNotEmpty,
  IsPositive,
  IsInt,
  Min,
  IsUrl,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @ApiProperty({
    description: 'Product name',
    example: 'Sample Product',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({
    description: 'Product description',
    example: 'This is a sample product description.',
  })
  @IsString()
  @IsNotEmpty()
  description?: string;

  @ApiProperty({
    description: 'Product picture URL',
    example: 'https://example.com/images/product.jpg',
  })
  @IsString()
  @IsNotEmpty()
  @IsUrl({}, { message: 'Picture must be a valid URL' })
  picture!: string;

  @ApiProperty({
    description: 'Product price in currency unit',
    example: 29.99,
    minimum: 0.01,
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Price must have at most 2 decimal places' },
  )
  @IsPositive({ message: 'Price must be a positive number' })
  @Type(() => Number)
  @Min(50, { message: 'Price must be at least 50' })
  price!: number;

  @ApiProperty({
    description: 'Available quantity in stock',
    example: 100,
    minimum: 0,
  })
  @IsInt({ message: 'Quantity must be an integer' })
  @Min(0, { message: 'Quantity cannot be negative' })
  @Type(() => Number)
  quantity!: number;

  @ApiProperty({
    description: 'Brand ID reference',
    example: 1,
  })
  @IsInt({ message: 'Brand ID must be an integer' })
  @IsPositive({ message: 'Brand ID must be a positive number' })
  @Type(() => Number)
  brandId!: number;

  @ApiProperty({
    description: 'Category ID reference',
    example: 5,
  })
  @IsInt({ message: 'Category ID must be an integer' })
  @IsPositive({ message: 'Category ID must be a positive number' })
  @Type(() => Number)
  categoryId!: number;
}
