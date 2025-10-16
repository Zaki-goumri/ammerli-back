import { CreateCustomerParams, UpdateCustomerParams } from '@zaki-g/chargili';
import { CreateAddressDto } from '../dtos/create-address.dto';
import { CreateUserDto } from '../dtos/create-user.dto';
import { Address } from '@zaki-g/chargili';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { UpdateAddressDto } from '../dtos/update-address.dto';
import { USER_ROLES } from 'src/common/enums/user-role.enum';

/**
 * Parses CreateUserDto to CreateCustomerParams format
 * Transforms NestJS DTO structure to a customer creation interface
 */
export function parseUserDtoToCreateCustomerParams(
  dto: CreateUserDto,
): CreateCustomerParams {
  const metadata: Record<string, any> = {
    role: dto.role || USER_ROLES.SUPERMARKET,
  };

  if (dto.supermarketName) {
    metadata.supermarketName = dto.supermarketName;
  }

  if (dto.locationUrl) {
    metadata.locationUrl = dto.locationUrl;
  }

  const params: CreateCustomerParams = {
    phone: dto.phoneNumber,
    metadata,
  };

  if (dto.name) {
    params.name = dto.name;
  }

  if (dto.address) {
    params.address = parseAddressDto(dto.address);
  }

  return params;
}

export function parseUserDtoToUpdateCustomerParams(
  dto: UpdateUserDto,
): UpdateCustomerParams {
  const metadata: Record<string, any> = {};

  if (dto.role) {
    metadata.role = dto.role;
  }

  if (dto.supermarketName) {
    metadata.supermarketName = dto.supermarketName;
  }

  if (dto.locationUrl) {
    metadata.locationUrl = dto.locationUrl;
  }

  const params: UpdateCustomerParams = {};

  if (dto.name) {
    params.name = dto.name;
  }

  if (dto.address) {
    params.address = parseAddressDto(dto.address);
  }

  if (Object.keys(metadata).length > 0) {
    params.metadata = metadata;
  }

  return params;
}

/**
 * Parses CreateAddressDto to Address format
 * Algeria (DZ) is used as the default country code
 */
function parseAddressDto(
  addressDto: CreateAddressDto | UpdateAddressDto,
): Address {
  // Build the detailed address line from available components
  const addressParts: string[] = [];

  if (addressDto.street) {
    addressParts.push(addressDto.street);
  }

  if (addressDto.district) {
    addressParts.push(addressDto.district);
  }

  const address: Address = {
    country: 'DZ',
    state: addressDto.city || '',
    address: addressParts.join(', ') || '',
  };

  return address;
}
