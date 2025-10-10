import {
  IsEnum,
  IsMobilePhone,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  USER_ROLE_VALUES,
  USER_ROLES,
  UserRole,
} from '../enums/user-role.enum';
import { CreateAddressDto } from './create-address.dto';
import { Transform } from 'class-transformer';

/*
 * DTO for creating a new user, including address details
 * Inherits address fields from Address entity
 */
export class CreateUserDto {
  @ApiProperty({
    description: 'User phone number (must be an Algerian mobile phone)',
    example: '+213551234567',
  })
  @IsString()
  @IsNotEmpty()
  @IsMobilePhone('ar-DZ', undefined, { message: 'Invalid phone number' })
  phoneNumber!: string;

  @ApiPropertyOptional({
    description: 'Full name of the user',
    example: 'John Doe',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Optional Google Maps location URL',
    example: 'https://maps.google.com/?q=36.7528,3.0422',
  })
  @IsString()
  @IsOptional()
  @IsUrl(undefined, { message: 'Invalid URL' })
  locationUrl?: string;

  @ApiPropertyOptional({
    description: 'Name of the supermarket if the user is a seller',
    example: 'Market El Baraka',
  })
  @IsString()
  @IsOptional()
  supermarketName?: string;

  @ApiPropertyOptional({
    description: 'Role of the user',
    example: 'superMarket',
    enum: USER_ROLE_VALUES,
  })
  @IsEnum(USER_ROLE_VALUES, {
    message: 'role must be either admin or superMarket, wholeseller',
  })
  @IsOptional()
  @Transform(({ value }) => value ?? USER_ROLES.SUPERMARKET)
  role?: UserRole = USER_ROLES.SUPERMARKET;

  @ApiPropertyOptional({
    description: 'Address details of the user',
    type: () => CreateAddressDto,
  })
  @IsOptional()
  address?: CreateAddressDto;
}
