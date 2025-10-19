import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUrl, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateAddressDto } from 'src/core/user/dtos/create-address.dto';

export class RegisterUserDto {
  @ApiProperty({
    description: "User's full name",
    example: 'Zaki Rahmani',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: "Google Maps location URL of the user's store or home",
    example: 'https://maps.google.com/?q=36.7525,3.04197',
  })
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  locationUrl: string;

  @ApiProperty({
    description: 'Name of the supermarket or store owned by the user',
    example: 'Super Marché El Baraka',
  })
  @IsString()
  @IsNotEmpty()
  supermarketName: string;

  @ApiProperty({
    description: 'Address details of the user',
    type: () => CreateAddressDto,
  })
  @ValidateNested()
  @Type(() => CreateAddressDto)
  address: CreateAddressDto;
}
