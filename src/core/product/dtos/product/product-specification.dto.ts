import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class ProductSpecificationDto {
  @ApiProperty({
    description: 'The ID of the specification',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  specificationId: number;

  @ApiProperty({
    description: 'The value of the specification for the product',
    example: '10',
  })
  @IsString()
  @IsNotEmpty()
  value: string;
}
