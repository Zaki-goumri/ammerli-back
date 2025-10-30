import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSpecificationDto {
  @ApiProperty({
    description: 'The label of the specification (e.g., Weight, Volume, Box)',
    example: 'Weight',
  })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiPropertyOptional({
    description: 'The unit of the specification (e.g., kg, L, pcs). Optional.',
    example: 'kg',
  })
  @IsOptional()
  @IsString()
  unity?: string;
}
