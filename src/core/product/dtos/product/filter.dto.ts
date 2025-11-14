import {
  IsOptional,
  IsInt,
  IsPositive,
  IsString,
  IsArray,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from 'src/common/dtos/pagination.dto';
import { parseIntArrayQueryParam } from 'src/common/utils';

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
    description: 'Filter by category IDs',
    example: [1, 2],
    type: [Number],
  })
  @IsOptional()
  @Transform(({ value }) => parseIntArrayQueryParam(value))
  @IsInt({ each: true })
  @IsPositive({ each: true })
  categoryIds?: number[];

  @ApiPropertyOptional({
    description: 'Filter by brand IDs',
    example: [1, 2],
    type: [Number],
  })
  @IsOptional()
  @Transform(({ value }) => parseIntArrayQueryParam(value))
  @IsInt({ each: true })
  @IsPositive({ each: true })
  brandIds?: number[];
}
