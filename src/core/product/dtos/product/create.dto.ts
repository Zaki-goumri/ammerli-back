import {
  IsString,
  IsNumber,
  IsNotEmpty,
  IsPositive,
  IsInt,
  Min,
  IsOptional,
  IsArray,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { parseStringArrayQueryParam } from 'src/common/utils';

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
    description: 'Product price in currency unit',
    example: 29.99,
    minimum: 0.01,
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Price must have at most 2 decimal places' },
  )
  @IsPositive({ message: 'Price must be a positive number' })
  @Transform(({ value }) => {
    const num = Number(value);
    return isNaN(num) ? value : num;
  })
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
  brandId: number;

  @ApiProperty({
    description: 'Category ID reference',
    example: 5,
  })
  @Type(() => Number)
  @IsInt({ message: 'Category ID must be an integer' })
  @IsPositive({ message: 'Category ID must be a positive number' })
  categoryId: number;

  @ApiProperty({
    description: 'Quantity produced per batch',
    example: 20,
  })
  @Type(() => Number)
  @IsNotEmpty()
  @IsInt({ message: 'Quantity per batch ID must be an integer' })
  @IsPositive({ message: 'Quantity per batch ID must be a positive number' })
  quantityPerBatch: number;

  @ApiPropertyOptional({
    description: 'An array of strings for product specifications',
    example: ['Material: Steel', 'Weight: 2kg'],
    type: [String],
  })
  @Transform(({ value }) => parseStringArrayQueryParam(value))
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specifications?: string[];

  @ApiProperty({
    description: 'The product expiration date (ISO 8601 format: YYYY-MM-DD)',
    example: '2026-12-31',
    format: 'date',
  })
  @IsOptional()
  @IsDateString(
    { strict: true },
    {
      message:
        'Expiration date must be a valid ISO 8601 date string (YYYY-MM-DD)',
    },
  )
  expirationDate?: string;
}
