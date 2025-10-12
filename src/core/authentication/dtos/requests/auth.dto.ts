import { ApiProperty } from '@nestjs/swagger';
import { IsMobilePhone } from 'class-validator';

export class AuthDto {
  @ApiProperty({
    example: '+213560620999',
    description: 'The phone number of the user',
  })
  @IsMobilePhone('ar-DZ', {}, { message: 'Invalid phone number' })
  phoneNumber: string;
}
