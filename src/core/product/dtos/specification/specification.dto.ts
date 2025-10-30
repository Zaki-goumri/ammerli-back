import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SpecificationDto {
  @ApiProperty({
    description: 'The ID of the specification',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'The label of the specification (e.g., Weight, Volume, Box)',
    example: 'Weight',
  })
  label: string;

  @ApiPropertyOptional({
    description: 'The unit of the specification (e.g., kg, L, pcs). Optional.',
    example: 'kg',
  })
  unity?: string;

  @ApiProperty({
    description: 'The value of the specification for the product',
    example: '10',
  })
  value: string;
}
