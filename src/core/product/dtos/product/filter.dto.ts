import {
  IsOptional,
  IsInt,
  IsPositive,
  IsString,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from 'src/common/dtos/pagination.dto';

export class FilterProductDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description:
      'Search term for product name, description, brand, or category',
    example: 'laptop',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by category ID',
    example: 1,
  })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  @IsPositive({ each: true })
  categoryIds?: number[];
}
