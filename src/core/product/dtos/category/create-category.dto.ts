import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

export class CreateCategoryDto {
  @ApiProperty({ description: 'Label name', example: 'Electronics' })
  @IsString()
  label: string;

  @ApiPropertyOptional({ description: 'parent category id', example: 1 })
  @IsOptional()
  @IsNumber({}, { message: 'parentId must be a number' })
  @IsPositive({ message: 'parentId must be a positive number' })
  parentId?: number;
}
