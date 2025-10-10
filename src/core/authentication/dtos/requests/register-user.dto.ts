import { extend } from 'lodash';
import { UpdateAddressDto } from 'src/core/user/dtos/update-address.dto';
import { UpdateUserDto } from 'src/core/user/dtos/update-user.dto';

export class RegisterUserDto extends UpdateUserDto {
  address: UpdateAddressDto;
}
