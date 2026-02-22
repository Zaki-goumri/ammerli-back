import { IsOptional, IsInt, IsString, Min } from 'class-validator';
import { Transform } from 'class-transformer';
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
  @Min(0, { each: true, message: 'categoryIds must be all positive' })
  categoryIds?: number[];

  @ApiPropertyOptional({
    description: 'Filter by brand IDs',
    example: [1, 2],
    type: [Number],
  })
  @IsOptional()
  @Transform(({ value }) => parseIntArrayQueryParam(value))
  @IsInt({ each: true })
  @Min(0, { each: true, message: 'brand ids must be positive' })
  brandIds?: number[];
}
