import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateAddressDto {
  @ApiProperty({
    description: 'Street name of the address',
    example: '123 Rue Didouche Mourad',
  })
  @IsString()
  street: string;

  @ApiProperty({
    description: 'City where the address is located',
    example: 'Algiers',
  })
  @IsString()
  city: string;

  @ApiProperty({
    description: 'District/Commune of the address',
    example: 'Bab El Oued',
  })
  @IsString()
  district: string;
}
