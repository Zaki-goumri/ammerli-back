import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateCategoryDto } from './create-category.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsNumber } from 'class-validator';

export class UpdateCategoryDto extends PartialType(
  OmitType(CreateCategoryDto, ['parentCategoryId'] as const),
) {
  @ApiPropertyOptional({ description: 'parent category id', example: 1 })
  @Transform(({ value }) => {
    console.log('RAW:', value, 'TYPE:', typeof value);
    if (value === 'null') return null;
    if (value === null) return null;
    if (value === '') return undefined;
    return parseInt(value, 10);
  })
  @IsOptional()
  newParentCategoryId?: number | null;
}
