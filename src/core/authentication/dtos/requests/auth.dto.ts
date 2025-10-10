import { ApiProperty } from '@nestjs/swagger';
import { IsMobilePhone } from 'class-validator';

export class AuthDto {
  @ApiProperty({
    example: '+1234567890',
    description: 'The phone number of the user',
  })
  @IsMobilePhone('ar-DZ', {}, { message: 'Invalid phone number' })
  phoneNumber: string;
}
