import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateAddressDto {
  @ApiPropertyOptional({
    description: 'Street address',
    example: '123 Rue Didouche Mourad',
  })
  @IsString()
  @IsOptional()
  street: string;

  @ApiPropertyOptional({
    description: 'City name',
    example: 'Algiers',
  })
  @IsString()
  @IsOptional()
  city: string;

  @ApiPropertyOptional({
    description: 'District/Commune',
    example: 'Bab El Oued',
  })
  @IsString()
  @IsOptional()
  district: string;
}
