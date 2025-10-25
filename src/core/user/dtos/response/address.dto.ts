import { ApiProperty } from '@nestjs/swagger';

export class AddressDto {
  @ApiProperty({
    example: 1,
    description: 'The unique identifier of the address.',
  })
  id: number;

  @ApiProperty({
    example: '123 Main St',
    description: 'The street of the address.',
  })
  street: string;

  @ApiProperty({
    example: 'Anytown',
    description: 'The district of the address.',
  })
  district: string;

  @ApiProperty({
    example: 'CA',
    description: 'The city of the address.',
  })
  city: string;
}
