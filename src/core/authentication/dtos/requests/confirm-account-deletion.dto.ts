import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, Length } from 'class-validator';

export class ConfirmAccountDeletionDto {
  @ApiProperty({
    description: 'Phone number in Algerian format',
    example: '+213550123456',
  })
  @IsString()
  @Matches(/^\+2135[0-9]{8}$/, {
    message: 'Phone number must be in Algerian format: +213XXXXXXXXX',
  })
  phoneNumber: string;

  @ApiProperty({
    description: 'OTP code received via SMS',
    example: '123456',
  })
  @IsString()
  @Length(4, 6)
  otp: string;
}
