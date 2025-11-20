import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateCategoryDto {
  @ApiProperty({ description: 'Label name', example: 'Electronics' })
  @IsString()
  label: string;

  @ApiPropertyOptional({ description: 'parent category id', example: 1 })
  @Transform(({ value }) => (value === '' ? undefined : parseInt(value, 10)))
  @IsOptional()
  @IsNumber()
  @IsPositive()
  parentId?: number;
}
