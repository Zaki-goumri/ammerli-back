import { ApiProperty } from '@nestjs/swagger';
import { IsMobilePhone, IsString, Length } from 'class-validator';

export class OtpValidationDto {
  @ApiProperty({
    example: '123456',
    description: 'The OTP code sent to the user',
  })
  @IsString({ message: 'OTP code must be a string' })
  @Length(4, 4, { message: 'OTP code must be exactly 6 characters long' })
  otp: string;

  @ApiProperty({
    example: '+213560620999',
    description: 'The phone number of the user',
  })
  @IsMobilePhone('ar-DZ', {}, { message: 'Invalid phone number' })
  phoneNumber: string;
}
