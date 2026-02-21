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
import { Transform } from 'class-transformer';
import { parseStringArrayQueryParam } from 'src/common/utils';

const toFloat = ({ value }: { value: any }) => {
  if (typeof value === 'number') return value;
  const normalized = String(value).replace(',', '.');
  const num = parseFloat(normalized);
  return isNaN(num) ? value : num;
};

const toInt = ({ value }: { value: any }) => {
  if (typeof value === 'number') return value;
  const num = parseInt(String(value), 10);
  return isNaN(num) ? value : num;
};

export class CreateProductDto {
  @ApiProperty({ example: 'Sample Product' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: 'This is a sample product description.' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 99.99, minimum: 50 })
  @Transform(toFloat)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Price must have at most 2 decimal places' },
  )
  @IsPositive({ message: 'Price must be a positive number' })
  @Min(50, { message: 'Price must be at least 50' })
  price!: number;

  @ApiProperty({ example: 100, minimum: 0 })
  @Transform(toInt)
  @IsInt({ message: 'Quantity must be an integer' })
  @Min(0, { message: 'Quantity cannot be negative' })
  quantity!: number;

  @ApiProperty({ example: 1 })
  @Transform(toInt)
  @IsInt({ message: 'Brand ID must be an integer' })
  @Min(0, { message: 'Brand ID must be positive' })
  brandId!: number;

  @ApiProperty({ example: 5 })
  @Transform(toInt)
  @IsInt({ message: 'Category ID must be an integer' })
  @Min(0, { message: 'Category ID must be positive' })
  categoryId!: number;

  @ApiProperty({ example: 20 })
  @Transform(toInt)
  @IsInt({ message: 'Quantity per batch must be an integer' })
  @IsPositive({ message: 'Quantity per batch must be a positive number' })
  @IsNotEmpty()
  quantityPerBatch!: number;

  @ApiPropertyOptional({
    example: ['Material: Steel', 'Weight: 2kg'],
    type: [String],
  })
  @Transform(({ value }) => parseStringArrayQueryParam(value))
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specification?: string[];

  @ApiPropertyOptional({ example: '2026-12-31', format: 'date' })
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
