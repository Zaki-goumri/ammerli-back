import { ApiProperty } from '@nestjs/swagger';

export class SendOtpDto {
  @ApiProperty({
    example: 'OTP sent to +1234567890',
    description: 'A success message.',
  })
  message: string;
}
