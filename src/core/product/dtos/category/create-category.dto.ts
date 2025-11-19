import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

export class CreateCategoryDto {
  @ApiProperty({ description: 'Label name', example: 'Electronics' })
  @IsString()
  label: string;

  @ApiPropertyOptional({ description: 'parent category id', example: 1 })
  @IsNumber()
  @IsOptional()
  @IsPositive()
  @Transform(({ value }) =>
    value !== null && value !== undefined ? Number(value) : value,
  )
  parentId?: number;
}
