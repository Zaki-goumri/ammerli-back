import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';
import { AuthDto } from './auth.dto';

export class OtpValidationDto extends AuthDto {
  @ApiProperty({
    example: '123456',
    description: 'The OTP code sent to the user',
  })
  @IsString({ message: 'OTP code must be a string' })
  @Length(4, 4, { message: 'OTP code must be exactly 4 characters long' })
  otp: string;
}
