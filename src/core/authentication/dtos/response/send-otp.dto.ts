import { ApiProperty } from '@nestjs/swagger';

export class SendOtpDto {
  @ApiProperty({
    example: 'OTP sent to +1234567890',
    description: 'A success message.',
  })
  message: string;

  @ApiProperty({
    example: '123456',
    description: 'The OTP code sent to the user (for testing purposes).',
  })
  otp?: string;
}
